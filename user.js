window.onload = async () => {
    await loadData();
};

const parseItems = (itemsData) => {
    if (Array.isArray(itemsData)) return itemsData;
    if (itemsData == null || itemsData === '') return [];

    if (typeof itemsData === 'string') {
        try {
            const parsed = JSON.parse(itemsData);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    if (typeof itemsData === 'object') {
        if (itemsData.name != null && itemsData.quantity != null) {
            return [itemsData];
        }
        return Object.values(itemsData).filter(
            item => item && item.name != null && item.quantity != null
        );
    }

    return [];
};

const loadData = async () => {
    try {
        const response = await axios.get('http://localhost:8000/orders');
        const orderDOM = document.getElementById('order-list');
        const orders = response.data;

        if (orders.length === 0) {
            orderDOM.innerHTML = '<p>ยังไม่มีคำสั่งซื้อ</p>';
            return;
        }

        let html = '';
        orders.forEach(order => {
            const items = parseItems(order.items);
            const itemText = Array.isArray(items)
                ? items.map(item => `${item.name} x ${item.quantity}`).join('\n')
                : '';

            html += `
                <div class="order-card">
                    <h2>คำสั่งซื้อ #${order.id} - ${order.status}</h2>
                    <p><strong>ลูกค้า:</strong> ${order.customerName}</p>
                    <p><strong>โทร:</strong> ${order.phone}</p>
                    <p><strong>ยอดรวม:</strong> ${Number(order.totalPrice).toFixed(2)} บาท</p>
                    <p><strong>รายการอาหาร:</strong></p>
                    <pre>${itemText}</pre>
                    <p><strong>วันที่:</strong> ${(() => {
                        const raw = order.createdAt || order.created_at;
                        const d = raw ? new Date(raw) : null;
                        return (d && !isNaN(d)) ? d.toLocaleString('th-TH') : '-';
                    })()}</p>
                    <div class="actions">
                        <a href="menu1.html?id=${order.id}"><button class="btn-edit">แก้ไข</button></a>
                        ${order.status === 'Awaiting Payment'
                            ? `<button class="btn-pay" data-id="${order.id}">ยืนยันชำระเงิน</button>`
                            : ''}
                        ${order.status === 'Paid' || order.status === 'Queued'
                            ? `<button class="btn-complete" data-id="${order.id}">ทำสำเร็จ</button>`
                            : ''}
                        <button class="btn-delete" data-id="${order.id}">ลบ</button>
                    </div>
                </div>
            `;
        });

        orderDOM.innerHTML = html;

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                if (!confirm('ลบคำสั่งซื้อใช่หรือไม่?')) return;
                try {
                    await axios.delete(`http://localhost:8000/orders/${id}`);
                    await loadData();
                } catch (error) {
                    console.error('Delete error', error);
                    alert('ไม่สามารถลบคำสั่งซื้อได้');
                }
            });
        });

        document.querySelectorAll('.btn-pay').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                const order = orders.find(o => String(o.id) === String(id));
                if (!order) return;
                try {
                    const updatedOrder = {
                        customerName: order.customerName,
                        phone: order.phone,
                        items: parseItems(order.items),
                        totalPrice: order.totalPrice,
                        status: 'Paid'
                    };
                    await axios.put(`http://localhost:8000/orders/${id}`, updatedOrder);
                    await loadData();
                } catch (error) {
                    console.error('Payment confirm error', error);
                    alert('ไม่สามารถยืนยันการชำระเงินได้');
                }
            });
        });

        document.querySelectorAll('.btn-complete').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                const order = orders.find(o => String(o.id) === String(id));
                if (!order) return;
                try {
                    const updatedOrder = {
                        customerName: order.customerName,
                        phone: order.phone,
                        items: parseItems(order.items),
                        totalPrice: order.totalPrice,
                        status: 'Completed'
                    };
                    await axios.put(`http://localhost:8000/orders/${id}`, updatedOrder);
                    await loadData();
                } catch (error) {
                    console.error('Complete error', error);
                    alert('ไม่สามารถปรับสถานะได้');
                }
            });
        });
    } catch (error) {
        console.error('Load orders error', error);
        document.getElementById('order-list').innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดคำสั่งซื้อ</p>';
    }
};