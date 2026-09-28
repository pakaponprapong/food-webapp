const express = require('express');     // เรียกใช้งาน Express framework
const mysql = require('mysql2/promise'); // เรียกใช้งาน MySQL แบบ Promise
const cors = require('cors');
const app = express();                  // สร้างแอปพลิเคชัน Express

const port = 8000;                      // กำหนดพอร์ตที่เซิร์ฟเวอร์จะรัน

app.use(express.json());                // สำหรับรับข้อมูล JSON
app.use(cors());                       // เปิดใช้งาน CORS

let conn = null;

const normalizeCategory = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return '';
    const lower = text.toLowerCase();
    if (['meat', 'เนื้อ', 'beef', 'chicken'].includes(lower)) return 'เนื้อ';
    if (['vegetable', 'ผัก'].includes(lower)) return 'ผัก';
    if (['meatball', 'ลูกชิ้น'].includes(lower)) return 'ลูกชิ้น';
    return text;
};

const toMenuRecord = (item, fallbackId) => ({
    id: Number(item?.id ?? fallbackId),
    name: String(item?.name ?? '').trim(),
    price: Number(item?.price ?? 0),
    category: normalizeCategory(item?.category)
});

const getMenusFromStore = async () => {
    if (!conn) {
        throw new Error('Database connection is not available');
    }

    const [rows] = await conn.query('SELECT * FROM menus ORDER BY id');
    return rows.map(row => toMenuRecord({ ...row }, row.id));
};

const ensureMenusTable = async () => {
    if (!conn) {
        throw new Error('Database connection is not available');
    }

    await conn.query(`
        CREATE TABLE IF NOT EXISTS menus (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            category VARCHAR(100) NOT NULL
        )
    `);
};

const getBangkokDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (7 * 60 * 60 * 1000));
};

const getTodayQueueKey = () => {
    const d = getBangkokDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ensureOrdersTable = async () => {
    if (!conn) {
        throw new Error('Database connection is not available');
    }

    await conn.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customerName VARCHAR(255) DEFAULT NULL,
            phone VARCHAR(50) DEFAULT NULL,
            items JSON DEFAULT NULL,
            totalPrice DECIMAL(10,2) DEFAULT 0,
            status VARCHAR(30) DEFAULT 'Awaiting Payment',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    const [columns] = await conn.query('SHOW COLUMNS FROM orders');
    const existing = new Set(columns.map(column => column.Field));
};

const ensureQueueTable = async () => {
    if (!conn) {
        throw new Error('Database connection is not available');
    }

    await conn.query(`
        CREATE TABLE IF NOT EXISTS queue (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            queue_number INT NOT NULL,
            day_key VARCHAR(10) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Paid',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_queue_order (order_id),
            UNIQUE KEY uq_queue_day_number (day_key, queue_number)
        )
    `);
};

const ensureQueueConfigTable = async () => {
    if (!conn) {
        throw new Error('Database connection is not available');
    }

    await conn.query(`
        CREATE TABLE IF NOT EXISTS queue_config (
            id INT PRIMARY KEY,
            day_key VARCHAR(10) NOT NULL,
            last_reset_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const today = getTodayQueueKey();
    await conn.query(
        'INSERT INTO queue_config (id, day_key, last_reset_at) VALUES (1, ?, NOW()) ON DUPLICATE KEY UPDATE day_key = VALUES(day_key), last_reset_at = NOW()',
        [today]
    );
};

const ensureDailyQueueState = async () => {
    if (!conn) {
        throw new Error('Database connection is not available');
    }

    const today = getTodayQueueKey();
    const [config] = await conn.query('SELECT day_key FROM queue_config WHERE id = 1');

    if (!config.length || config[0].day_key !== today) {
        await conn.query('DELETE FROM queue WHERE day_key != ?', [today]);
        await conn.query('UPDATE queue_config SET day_key = ?, last_reset_at = NOW() WHERE id = 1', [today]);
    }
};

const assignQueueNumber = async (orderId, status) => {
    if (!conn) {
        throw new Error('Database connection is not available');
    }

    const normalizedStatus = String(status || 'Awaiting Payment').trim();
    const today = getTodayQueueKey();

    if (!['Paid', 'Queued'].includes(normalizedStatus)) {
        await conn.query('DELETE FROM queue WHERE order_id = ?', [orderId]);
        return null;
    }

    const [existing] = await conn.query('SELECT * FROM queue WHERE order_id = ?', [orderId]);
    if (existing.length) {
        return { queueNumber: existing[0].queue_number, dayKey: existing[0].day_key };
    }

    const [result] = await conn.query(
        'SELECT IFNULL(MAX(queue_number), 0) + 1 AS nextQueueNumber FROM queue WHERE day_key = ?',
        [today]
    );

    const nextQueueNumber = Number(result[0].nextQueueNumber || 1);

    await conn.query(
        'INSERT INTO queue (order_id, queue_number, day_key, status) VALUES (?, ?, ?, ?)',
        [orderId, nextQueueNumber, today, normalizedStatus]
    );

    return { queueNumber: nextQueueNumber, dayKey: today };
};

const initMySQL = async () => {
    conn = await mysql.createConnection({    // สร้างการเชื่อมต่อฐานข้อมูล
        host: 'localhost',                  // ชื่อโฮสต์ฐานข้อมูล            
        user: 'root',                     // ชื่อผู้ใช้ฐานข้อมูล
        password: 'root',                 // รหัสผ่านฐานข้อมูล    
        database: 'mydb',                  // ชื่อฐานข้อมูล
        port:3307
    });
    console.log('MySQL Connected');        // แสดงข้อความยืนยันการเชื่อมต่อฐานข้อมูล
}

app.get('/users', async (req, res) => {       // เส้นทางสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
    try{
        const results = await conn.query('SELECT * FROM users')   // คำสั่ง SQL เพื่อดึงข้อมูลผู้ใช้ทั้งหมด.
        res.json(results[0]);    // ส่งผลลัพธ์ในรูปแบบ JSON
    } catch (error) {
        console.error('Error fetching users:', error);  // แสดงข้อผิดพลาดในคอนโซล
        res.status(500).json({    // ส่งการตอบกลับข้อผิดพลาด
            message: 'Something went wrong',
            errorMessage: error.message
        })
    }
})

app.post('/users', async (req, res) => {      // เส้นทางสำหรับเข้าสู่ระบบแอดมิน
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'ชื่อผู้ใช้และรหัสผ่านต้องไม่ว่าง'
            });
        }

        const [rows] = await conn.query(
            'SELECT id, username FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length > 0) {
            return res.json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ',
                user: rows[0]
            });
        }

        return res.status(401).json({
            success: false,
            message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        });
    } catch (error) {
        console.error('Error logging in:', error.message);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
        });
    }
});

app.get('/users/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const results = await conn.query('SELECT * FROM users WHERE id = ?', id);
        if (results[0].length > 0) {  // เพราะผลจากการ query ถ้ามีข้อมูลจะให้ผลเป็นความยาวของอาเรย์มากกว่า 0
            res.json(results[0][0]);  // ส่งข้อมูลผู้ใช้ที่พบกลับไป ข้อมูลที่อยู่ใน array [0] คือผลลัพธ์ทั้งหมด  และ [0] ตัวที่สองคือข้อมูลผู้ใช้ตัวแรกที่พบ
        } else {
            //res.status(404).json({
            //    message: 'User not found'
            //})
            throw new Error('User not found');  // ลองโยนข้อผิดพลาดขึ้นมาแทน (ก่อนหน้านี้ที่ไม่ error เพราะมันเจอ array ที่มีค่าเป็นค่าว่าง)
        }
    } catch (error) {
        console.log('errorMessage', error.message);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        })
    }
})

app.put('/users/:id', async (req, res) => {      // เส้นทางสำหรับเพิ่มผู้ใช้ใหม่
    try {
        let id = req.params.id;
        let updateUser = req.body;
        const results = await conn.query(
            'UPDATE users SET ? WHERE id = ?', [updateUser, id]);
        res.json({
            message: 'update ok',
            data: results[0]
        });
    } catch (error) {
        res.status(500).json({    // ส่งการตอบกลับข้อผิดพลาด
            message: 'Something went wrong',
            errorMessage: error.message
        })
    }
})

app.get('/orders', async (req, res) => {
    try {
        const [rows] = await conn.query(
            `SELECT o.*
             FROM orders o
             LEFT JOIN queue q ON q.order_id = o.id
             ORDER BY CASE WHEN q.queue_number IS NULL THEN 1 ELSE 0 END, q.queue_number, o.id DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.get('/queue', async (req, res) => {
    try {
        const today = getTodayQueueKey();
        const [rows] = await conn.query(
            `SELECT q.*, o.customerName, o.phone, o.totalPrice, o.status AS orderStatus
             FROM queue q
             JOIN orders o ON o.id = q.order_id
             WHERE q.day_key = ?
             ORDER BY q.queue_number ASC, q.created_at ASC`,
            [today]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.post('/orders', async (req, res) => {
    try {
        const order = req.body || {};
        const status = String(order.status || 'Awaiting Payment').trim();
        const insertData = {
            customerName: order.customerName || '',
            phone: order.phone || '',
            items: JSON.stringify(order.items || []),
            totalPrice: Number(order.totalPrice || 0),
            status
        };

            const results = await conn.query('INSERT INTO orders SET ?', insertData);
        const orderId = results[0].insertId;
        const queueInfo = await assignQueueNumber(orderId, status);

        res.json({
            message: 'order added',
            orderId,
            queueNumber: queueInfo ? queueInfo.queueNumber : null,
            queueDay: queueInfo ? queueInfo.dayKey : null,
            status
        });
    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.get('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const results = await conn.query('SELECT * FROM orders WHERE id = ?', id);
        if (results[0].length > 0) {
            res.json(results[0][0]);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.put('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedOrder = req.body || {};
        const normalizedStatus = String(updatedOrder.status || 'Awaiting Payment').trim();
        const updateData = {
            ...updatedOrder,
            status: normalizedStatus,
            items: JSON.stringify(updatedOrder.items || [])
        };

        const results = await conn.query('UPDATE orders SET ? WHERE id = ?', [updateData, id]);

        if (normalizedStatus === 'Paid' || normalizedStatus === 'Queued') {
            await assignQueueNumber(id, normalizedStatus);
        } else {
            await conn.query('DELETE FROM queue WHERE order_id = ?', [id]);
        }

        res.json({
            message: 'order updated',
            data: results[0]
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.delete('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const results = await conn.query('DELETE FROM orders WHERE id = ?', id);
        res.json({
            message: 'order deleted',
            data: results[0]
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.delete('/users/:id', async (req, res) => {      // เส้นทางสำหรับเพิ่มผู้ใช้ใหม่
    try {
        let id = req.params.id;
        const results = await conn.query('DELETE FROM users WHERE id = ?', id);
        res.json({
            message: 'delete ok',
            data: results[0]
        });
    } catch (error) {
        res.status(500).json({    // ส่งการตอบกลับข้อผิดพลาด
            message: 'Something went wrong',
            errorMessage: error.message
        })
    }
    
})

app.get(['/menus', '/api/menus'], async (req, res) => {
    try {
        const category = req.query.category;
        const normalizedCategory = normalizeCategory(category);

        if (!conn) {
            throw new Error('Database connection is not available');
        }

        let query = 'SELECT * FROM menus';
        const params = [];

        if (normalizedCategory) {
            query += ' WHERE category = ?';
            params.push(normalizedCategory);
        }

        query += ' ORDER BY id';
        const [rows] = await conn.query(query, params);
        const menus = rows.map(row => toMenuRecord({ ...row }, row.id));
        res.json(menus);
    } catch (error) {
        console.error('Error fetching menus:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.post(['/menus', '/api/menus'], async (req, res) => {
    try {
        const body = req.body || {};
        const category = normalizeCategory(body.category);
        const name = String(body.name ?? '').trim();
        const price = Number(body.price ?? 0);

        if (!name || !category) {
            return res.status(400).json({ message: 'Name and category are required' });
        }

        const [result] = await conn.query('INSERT INTO menus (name, price, category) VALUES (?, ?, ?)', [name, price, category]);
        const [rows] = await conn.query('SELECT * FROM menus WHERE id = ?', [result.insertId]);
        res.json(toMenuRecord(rows[0], result.insertId));
    } catch (error) {
        console.error('Error creating menu:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.put(['/menus/:id', '/api/menus/:id'], async (req, res) => {
    try {
        const id = Number(req.params.id);
        const body = req.body || {};
        const name = String(body.name ?? '').trim();
        const price = Number(body.price ?? 0);
        const category = normalizeCategory(body.category);

        if (!name || !category) {
            return res.status(400).json({ message: 'Name and category are required' });
        }

        await conn.query('UPDATE menus SET name = ?, price = ?, category = ? WHERE id = ?', [name, price, category, id]);
        const [rows] = await conn.query('SELECT * FROM menus WHERE id = ?', [id]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Menu not found' });
        }

        res.json(toMenuRecord(rows[0], id));
    } catch (error) {
        console.error('Error updating menu:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.delete(['/menus/:id', '/api/menus/:id'], async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await conn.query('DELETE FROM menus WHERE id = ?', id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Menu not found' });
        }

        res.json({ message: 'menu deleted' });
    } catch (error) {
        console.error('Error deleting menu:', error);
        res.status(500).json({
            message: 'Something went wrong',
            errorMessage: error.message
        });
    }
});

app.listen(port, async () => {                // เริ่มต้นเซิร์ฟเวอร์ที่พอร์ตที่กำหนด
    await initMySQL();                     // เรียกใช้ฟังก์ชันการเชื่อมต่อฐานข้อมูล MySQL
    await ensureOrdersTable();
    await ensureQueueTable();
    await ensureQueueConfigTable();
    await ensureDailyQueueState();
    await ensureMenusTable();             // สร้างตาราง menus ถ้ายังไม่มี
    console.log('Http Server is run at port ' + port);  // แสดงข้อความยืนยันว่าเซิร์ฟเวอร์กำลังรัน
})