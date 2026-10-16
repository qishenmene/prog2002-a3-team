-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: charityevents_db
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Fun Run'),(2,'Gala'),(3,'Auction'),(4,'Concert');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `event_name` varchar(100) NOT NULL,
  `event_date` date NOT NULL,
  `event_time` time NOT NULL,
  `event_address` varchar(150) NOT NULL,
  `event_purpose` varchar(150) NOT NULL,
  `event_description` varchar(500) NOT NULL,
  `event_ticket_price` decimal(10,2) NOT NULL,
  `event_goal_amount` decimal(10,2) NOT NULL,
  `event_goal_raised_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `event_category_id` int NOT NULL,
  `event_organisation_id` int NOT NULL,
  `event_availability` varchar(50) NOT NULL DEFAULT 'Available',
  PRIMARY KEY (`event_id`),
  KEY `event_category_id` (`event_category_id`),
  KEY `event_organisation_id` (`event_organisation_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`event_category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`event_organisation_id`) REFERENCES `organisations` (`organisation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Campus Charity Fun Run','2026-10-12','09:00:00','20 University Drive, Gold Coast, Queensland, Australia','Raise funds for students who need academic support','A community fun run where students and local residents can participate and support students who need extra academic assistance.',15.00,5000.00,1250.00,1,1,'Available'),(2,'Student Support Gala Night','2026-11-05','18:30:00','88 Harbour Street, Gold Coast, Queensland, Australia','Support students experiencing financial and academic difficulties','An evening fundraising gala with dinner, student speakers and presentations about the academic support programs provided by Students Helper.',65.00,12000.00,4800.00,2,1,'Available'),(3,'Books and Technology Charity Auction','2026-10-25','14:00:00','45 Learning Avenue, Gold Coast, Queensland, Australia','Provide study materials and technology to students in need','A charity auction featuring donated books, tablets, computer accessories and other study resources contributed by local businesses and community members.',5.00,8000.00,2100.00,3,1,'Available'),(4,'Music for Students Concert','2026-12-03','19:00:00','120 Coastal Road, Gold Coast, Queensland, Australia','Fund free tutoring sessions for college students','A live music concert featuring student performers and local musicians, with ticket proceeds supporting free tutoring and academic assistance programs.',30.00,10000.00,3250.00,4,1,'Available'),(5,'Spring Campus Fun Run','2026-09-15','08:30:00','10 College Park Road, Gold Coast, Queensland, Australia','Raise awareness of academic pressure among college students','A campus fun run organised to encourage student wellbeing and raise funds for additional academic support services.',10.00,4000.00,4000.00,1,1,'Available'),(6,'Future Scholars Gala','2026-12-18','18:00:00','75 Riverside Avenue, Gold Coast, Queensland, Australia','Help students who are struggling to achieve satisfactory assessment results','A formal fundraising dinner focused on expanding tutoring, mentoring and study support services for college students.',75.00,15000.00,6200.00,2,1,'Available'),(7,'Study Essentials Auction','2026-11-22','13:00:00','33 Education Street, Gold Coast, Queensland, Australia','Purchase essential learning resources for disadvantaged students','An auction of donated electronics, textbooks and stationery, with all proceeds used to provide learning resources to students requiring additional support.',0.00,7000.00,950.00,3,1,'Suspended'),(8,'Voices of the Campus Concert','2026-09-20','17:30:00','56 Campus Boulevard, Gold Coast, Queensland, Australia','Support peer tutoring and mentoring programs','A student music event featuring bands and solo performers, organised to raise funds for peer tutoring and mentoring services.',20.00,6000.00,5400.00,4,1,'Available');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organisations`
--

DROP TABLE IF EXISTS `organisations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organisations` (
  `organisation_id` int NOT NULL AUTO_INCREMENT,
  `organisation_name` varchar(100) NOT NULL,
  `organisation_description` varchar(150) NOT NULL,
  `organisation_email` varchar(100) NOT NULL,
  `organisation_phone_number` varchar(20) DEFAULT NULL,
  `organisation_address` varchar(150) NOT NULL,
  PRIMARY KEY (`organisation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organisations`
--

LOCK TABLES `organisations` WRITE;
/*!40000 ALTER TABLE `organisations` DISABLE KEYS */;
INSERT INTO `organisations` VALUES (1,'Students Helper','Help college students who need academic support or cannot get high scores in their assessments.','media@studentshelper.org','07 2486 3179','12 Students Avenue, Gold Coast, Queensland, Australia');
/*!40000 ALTER TABLE `organisations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

--
-- Table structure for table `registrations` (NEW for A3)
-- Stores user registrations for charity events
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registrations` (
  `registration_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `user_email` varchar(100) NOT NULL,
  `user_phone` varchar(20) DEFAULT NULL,
  `num_tickets` int NOT NULL DEFAULT '1',
  `registration_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`registration_id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_event` (`user_email`,`event_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations` (12 sample records for A3)
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
INSERT INTO `registrations` VALUES 
(1,1,'Alice Johnson','alice.j@email.com','0412345678',2,'2026-10-01 09:30:00'),
(2,1,'Bob Smith','bob.smith@email.com','0423456789',1,'2026-10-02 14:15:00'),
(3,2,'Carol White','carol.w@email.com','0434567890',4,'2026-10-03 10:00:00'),
(4,2,'David Brown','david.b@email.com',NULL,2,'2026-10-04 16:45:00'),
(5,3,'Emma Davis','emma.d@email.com','0456789012',1,'2026-10-05 11:20:00'),
(6,3,'Frank Miller','frank.m@email.com','0467890123',3,'2026-10-06 13:30:00'),
(7,4,'Grace Lee','grace.l@email.com','0478901234',2,'2026-10-07 15:00:00'),
(8,4,'Henry Wilson','henry.w@email.com',NULL,1,'2026-10-08 09:45:00'),
(9,5,'Ivy Chen','ivy.c@email.com','0489012345',2,'2026-10-09 12:00:00'),
(10,6,'Jack Taylor','jack.t@email.com','0490123456',1,'2026-10-10 14:30:00'),
(11,6,'Karen Moore','karen.m@email.com','0401234567',3,'2026-10-11 10:15:00'),
(12,8,'Liam Anderson','liam.a@email.com','0412345670',2,'2026-10-12 16:00:00');
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;

-- Dump completed on 2026-10-01 11:50:31
