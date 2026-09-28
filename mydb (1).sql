-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Sep 28, 2026 at 03:57 AM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mydb`
--

-- --------------------------------------------------------

--
-- Table structure for table `menus`
--

CREATE TABLE `menus` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `price` varchar(10) DEFAULT '10',
  `category` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `menus`
--

INSERT INTO `menus` (`id`, `name`, `price`, `category`) VALUES
(1, 'ลูกชิ้น', '10', 'ลูกชิ้น'),
(2, 'ไส้กรอกชีส', '10', 'ลูกชิ้น'),
(3, 'บีลักกี้', '10', 'ลูกชิ้น'),
(4, 'ปูอัด', '10', 'ลูกชิ้น'),
(5, 'เต้าหู้ปลา', '10', 'ลูกชิ้น'),
(6, 'เห็ดเข็มทองพันสามชั้น', '10', 'ผัก'),
(7, 'เห็ดออริจิ', '10', 'ผัก'),
(8, 'สาหร่ายวากาเมะสามชั้น', '10', 'ผัก'),
(9, 'พริกหยวก', '10', 'ผัก'),
(10, 'บร็อคโคลี่', '10', 'ผัก'),
(11, 'หมูสามชั้น', '10', 'เนื้อ'),
(12, 'บาบึคิวไก่', '15', 'เนื้อ'),
(13, 'เบคอน', '10', 'เนื้อ'),
(14, 'ปลาดอลี่', '10', 'เนื้อ'),
(15, 'หมูส้นนอก', '10', 'เนื้อ');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customerName` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `items` text,
  `totalPrice` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customerName`, `phone`, `items`, `totalPrice`, `status`, `created_at`, `createdAt`, `updatedAt`) VALUES
(3, 'เสก', '033333333', '[{\"id\":1,\"name\":\"หมูสามชั้น\",\"price\":10,\"quantity\":2},{\"id\":11,\"name\":\"ไส้กรอกชีส\",\"price\":10,\"quantity\":2},{\"id\":7,\"name\":\"เห็ดออริจิ\",\"price\":10,\"quantity\":2},{\"id\":2,\"name\":\"บาบึคิวไก่\",\"price\":15,\"quantity\":1}]', '75.00', 'Completed', '2026-06-19 03:08:22', '2026-08-25 20:03:15', '2026-08-25 20:03:15'),
(4, 'john', '0991234567', '[{\"id\":11,\"name\":\"หมูสามชั้น\",\"price\":10,\"category\":\"เนื้อ\",\"quantity\":2},{\"id\":12,\"name\":\"บาบึคิวไก่\",\"price\":15,\"category\":\"เนื้อ\",\"quantity\":2}]', '50.00', 'Paid', '2026-08-25 13:04:05', '2026-08-25 20:04:05', '2026-08-25 20:04:05'),
(5, 'jj', '01111111', '[{\"id\":11,\"name\":\"หมูสามชั้น\",\"price\":10,\"category\":\"เนื้อ\",\"quantity\":2},{\"id\":12,\"name\":\"บาบึคิวไก่\",\"price\":15,\"category\":\"เนื้อ\",\"quantity\":2}]', '50.00', 'Completed', '2026-08-25 13:29:48', '2026-08-25 20:29:48', '2026-08-25 20:58:06'),
(6, 'John', '091111', '[{\"id\":11,\"name\":\"หมูสามชั้น\",\"price\":10,\"category\":\"เนื้อ\",\"quantity\":2},{\"id\":12,\"name\":\"บาบึคิวไก่\",\"price\":15,\"category\":\"เนื้อ\",\"quantity\":2}]', '50.00', 'Completed', '2026-08-26 06:58:29', '2026-08-26 13:58:29', '2026-08-26 14:01:46'),
(7, 'Jane', '0912345678', '[{\"id\":11,\"name\":\"หมูสามชั้น\",\"price\":10,\"category\":\"เนื้อ\",\"quantity\":2},{\"id\":13,\"name\":\"เบคอน\",\"price\":10,\"category\":\"เนื้อ\",\"quantity\":2},{\"id\":1,\"name\":\"ลูกชิ้น\",\"price\":10,\"category\":\"ลูกชิ้น\",\"quantity\":2},{\"id\":2,\"name\":\"ไส้กรอกชีส\",\"price\":10,\"category\":\"ลูกชิ้น\",\"quantity\":2}]', '80.00', 'Paid', '2026-08-26 07:01:06', '2026-08-26 14:01:06', '2026-08-26 14:01:16'),
(8, 'Jessada', '0812345678', '[{\"id\":11,\"name\":\"หมูสามชั้น\",\"price\":10,\"category\":\"เนื้อ\",\"quantity\":2},{\"id\":6,\"name\":\"เห็ดเข็มทองพันสามชั้น\",\"price\":10,\"category\":\"ผัก\",\"quantity\":2},{\"id\":1,\"name\":\"ลูกชิ้น\",\"price\":10,\"category\":\"ลูกชิ้น\",\"quantity\":2}]', '60.00', 'Completed', '2026-08-26 07:03:06', '2026-08-26 14:03:06', '2026-08-26 14:05:21');

-- --------------------------------------------------------

--
-- Table structure for table `queue`
--

CREATE TABLE `queue` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `queue_number` int(11) NOT NULL,
  `day_key` varchar(10) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Paid',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `queue`
--

INSERT INTO `queue` (`id`, `order_id`, `queue_number`, `day_key`, `status`, `created_at`) VALUES
(5, 9, 2, '2026-08-26', 'Paid', '2026-08-26 00:33:16'),
(7, 7, 4, '2026-08-26', 'Paid', '2026-08-26 14:01:16');

-- --------------------------------------------------------

--
-- Table structure for table `queue_config`
--

CREATE TABLE `queue_config` (
  `id` int(11) NOT NULL,
  `day_key` varchar(10) NOT NULL,
  `last_reset_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `queue_config`
--

INSERT INTO `queue_config` (`id`, `day_key`, `last_reset_at`) VALUES
(1, '2026-08-26', '2026-08-26 13:16:23');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'Jane', '1234', '2026-07-29 13:50:02'),
(2, 'Garfield', '1234', '2026-08-26 06:30:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `queue`
--
ALTER TABLE `queue`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_queue_order` (`order_id`),
  ADD UNIQUE KEY `uq_queue_day_number` (`day_key`,`queue_number`);

--
-- Indexes for table `queue_config`
--
ALTER TABLE `queue_config`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `menus`
--
ALTER TABLE `menus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `queue`
--
ALTER TABLE `queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
