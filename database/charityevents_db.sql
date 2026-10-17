-- ---------------------------------------------------------------------------
-- PROG2002 Web Development II - Assignment 3
-- Charity Events database (charityevents_db)
--
-- Team: Jihan Qu (24832627) & Shixiang Tang
-- Updated: 2026-10-17
--
-- A3 changes compared with A2:
--   1. New `registrations` table (one row per ticket purchase) with primary key,
--      a foreign key to `events`, and a unique key so one user can only register
--      for the same event once.
--   2. `events` now stores latitude and longitude so the Open-Meteo weather API
--      can return a forecast for the exact event location.
--   3. Extra seed data: 10 events and 16 registrations.
--
-- Import with:  mysql -u <user> -p < charityevents_db.sql
-- In cPanel / phpMyAdmin: select the database, open Import, choose this file.
-- If your host does not allow CREATE DATABASE, remove the two lines marked
-- "HOSTING NOTE" and import into a database you created in cPanel first.
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `charityevents_db`   -- HOSTING NOTE (line 1)
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
USE `charityevents_db`;                            -- HOSTING NOTE (line 2)

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Table: organisations
-- The charity that runs the events.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `organisations`;
CREATE TABLE `organisations` (
  `organisation_id` int NOT NULL AUTO_INCREMENT,
  `organisation_name` varchar(100) NOT NULL,
  `organisation_description` varchar(150) NOT NULL,
  `organisation_email` varchar(100) NOT NULL,
  `organisation_phone_number` varchar(20) DEFAULT NULL,
  `organisation_address` varchar(150) NOT NULL,
  PRIMARY KEY (`organisation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `organisations`
  (`organisation_id`, `organisation_name`, `organisation_description`, `organisation_email`, `organisation_phone_number`, `organisation_address`)
VALUES
  (1, 'Students Helper', 'Help college students who need academic support or cannot get high scores in their assessments.', 'media@studentshelper.org', '07 2486 3179', '12 Students Avenue, Gold Coast, Queensland, Australia');

-- ---------------------------------------------------------------------------
-- Table: categories
-- Event categories used by the search filter and the admin forms.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `categories` (`category_id`, `category_name`) VALUES
  (1, 'Fun Run'),
  (2, 'Gala'),
  (3, 'Auction'),
  (4, 'Concert');

-- ---------------------------------------------------------------------------
-- Table: events
-- latitude / longitude were added in A3 for the external weather API.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `events`;
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
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  PRIMARY KEY (`event_id`),
  KEY `event_category_id` (`event_category_id`),
  KEY `event_organisation_id` (`event_organisation_id`),
  KEY `event_date_availability` (`event_date`, `event_availability`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`event_category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`event_organisation_id`) REFERENCES `organisations` (`organisation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `events`
  (`event_id`, `event_name`, `event_date`, `event_time`, `event_address`, `event_purpose`, `event_description`, `event_ticket_price`, `event_goal_amount`, `event_goal_raised_amount`, `event_category_id`, `event_organisation_id`, `event_availability`, `latitude`, `longitude`)
VALUES
  (1, 'Campus Charity Fun Run', '2026-10-12', '09:00:00', '20 University Drive, Gold Coast, Queensland, Australia', 'Raise funds for students who need academic support', 'A community fun run where students and local residents can participate and support students who need extra academic assistance.', 15.00, 5000.00, 1250.00, 1, 1, 'Available', -27.962000, 153.230000),
  (2, 'Student Support Gala Night', '2026-11-05', '18:30:00', '88 Harbour Street, Gold Coast, Queensland, Australia', 'Support students experiencing financial and academic difficulties', 'An evening fundraising gala with dinner, student speakers and presentations about the academic support programs provided by Students Helper.', 65.00, 12000.00, 4800.00, 2, 1, 'Available', -27.968000, 153.400000),
  (3, 'Books and Technology Charity Auction', '2026-10-25', '14:00:00', '45 Learning Avenue, Gold Coast, Queensland, Australia', 'Provide study materials and technology to students in need', 'A charity auction featuring donated books, tablets, computer accessories and other study resources contributed by local businesses and community members.', 5.00, 8000.00, 2100.00, 3, 1, 'Available', -28.000000, 153.410000),
  (4, 'Music for Students Concert', '2026-12-03', '19:00:00', '120 Coastal Road, Gold Coast, Queensland, Australia', 'Fund free tutoring sessions for college students', 'A live music concert featuring student performers and local musicians, with ticket proceeds supporting free tutoring and academic assistance programs.', 30.00, 10000.00, 3250.00, 4, 1, 'Available', -28.030000, 153.430000),
  (5, 'Spring Campus Fun Run', '2026-09-15', '08:30:00', '10 College Park Road, Gold Coast, Queensland, Australia', 'Raise awareness of academic pressure among college students', 'A campus fun run organised to encourage student wellbeing and raise funds for additional academic support services.', 10.00, 4000.00, 4000.00, 1, 1, 'Available', -27.975000, 153.220000),
  (6, 'Future Scholars Gala', '2026-12-18', '18:00:00', '75 Riverside Avenue, Gold Coast, Queensland, Australia', 'Help students who are struggling to achieve satisfactory assessment results', 'A formal fundraising dinner focused on expanding tutoring, mentoring and study support services for college students.', 75.00, 15000.00, 6200.00, 2, 1, 'Available', -27.990000, 153.390000),
  (7, 'Study Essentials Auction', '2026-11-22', '13:00:00', '33 Education Street, Gold Coast, Queensland, Australia', 'Purchase essential learning resources for disadvantaged students', 'An auction of donated electronics, textbooks and stationery, with all proceeds used to provide learning resources to students requiring additional support.', 0.00, 7000.00, 950.00, 3, 1, 'Suspended', -28.010000, 153.405000),
  (8, 'Voices of the Campus Concert', '2026-09-20', '17:30:00', '56 Campus Boulevard, Gold Coast, Queensland, Australia', 'Support peer tutoring and mentoring programs', 'A student music event featuring bands and solo performers, organised to raise funds for peer tutoring and mentoring services.', 20.00, 6000.00, 5400.00, 4, 1, 'Available', -27.960000, 153.235000),
  (9, 'Winter Warmth Gala', '2026-11-28', '18:00:00', '150 Ocean Parade, Gold Coast, Queensland, Australia', 'Provide warm clothing and study kits for students in need', 'A black tie fundraising dinner with a silent auction, raising money for winter support packs and study kits for students facing financial hardship.', 80.00, 18000.00, 2400.00, 2, 1, 'Available', -28.020000, 153.415000),
  (10, 'Community Book Fair', '2026-12-10', '10:00:00', '18 Library Lane, Gold Coast, Queensland, Australia', 'Raise money for free tutoring sessions', 'A family friendly book fair selling donated books, with every dollar supporting free tutoring sessions for first year students.', 2.00, 3000.00, 600.00, 3, 1, 'Available', -27.980000, 153.380000);

-- ---------------------------------------------------------------------------
-- Table: registrations  (NEW in A3)
--
-- Design notes:
--   * registration_id   - surrogate primary key
--   * event_id          - foreign key to events; ON DELETE RESTRICT means MySQL
--                         itself also refuses to delete an event that still has
--                         registrations, backing up the API level check
--   * user_name / user_email / user_phone - user details (no USER table needed)
--   * num_tickets       - how many tickets were purchased
--   * registration_date - when the purchase happened; used for the "latest
--                         first" ordering on the event detail page
--   * UNIQUE (user_email, event_id) - a user can register for an event only
--                         once, but may register for many different events
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE `registrations` (
  `registration_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `user_email` varchar(100) NOT NULL,
  `user_phone` varchar(20) DEFAULT NULL,
  `num_tickets` int NOT NULL DEFAULT '1',
  `registration_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`registration_id`),
  UNIQUE KEY `unique_user_event` (`user_email`, `event_id`),
  KEY `event_id_registration_date` (`event_id`, `registration_date`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `registrations_tickets_check` CHECK (`num_tickets` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `registrations`
  (`registration_id`, `event_id`, `user_name`, `user_email`, `user_phone`, `num_tickets`, `registration_date`)
VALUES
  (1, 1, 'Alice Johnson', 'alice.j@email.com', '0412345678', 2, '2026-10-01 09:30:00'),
  (2, 1, 'Bob Smith', 'bob.smith@email.com', '0423456789', 1, '2026-10-02 14:15:00'),
  (3, 2, 'Carol White', 'carol.w@email.com', '0434567890', 4, '2026-10-03 10:00:00'),
  (4, 2, 'David Brown', 'david.b@email.com', NULL, 2, '2026-10-04 16:45:00'),
  (5, 3, 'Emma Davis', 'emma.d@email.com', '0456789012', 1, '2026-10-05 11:20:00'),
  (6, 3, 'Frank Miller', 'frank.m@email.com', '0467890123', 3, '2026-10-06 13:30:00'),
  (7, 4, 'Grace Lee', 'grace.l@email.com', '0478901234', 2, '2026-10-07 15:00:00'),
  (8, 4, 'Henry Wilson', 'henry.w@email.com', NULL, 1, '2026-10-08 09:45:00'),
  (9, 5, 'Ivy Chen', 'ivy.c@email.com', '0489012345', 2, '2026-10-09 12:00:00'),
  (10, 6, 'Jack Taylor', 'jack.t@email.com', '0490123456', 1, '2026-10-10 14:30:00'),
  (11, 6, 'Karen Moore', 'karen.m@email.com', '0401234567', 3, '2026-10-11 10:15:00'),
  (12, 8, 'Liam Anderson', 'liam.a@email.com', '0412345670', 2, '2026-10-12 16:00:00'),
  (13, 2, 'Mia Patel', 'mia.patel@email.com', '0423456701', 1, '2026-10-13 09:10:00'),
  (14, 9, 'Noah Nguyen', 'noah.n@email.com', '0434567801', 2, '2026-10-14 18:20:00'),
  (15, 9, 'Olivia Rossi', 'olivia.r@email.com', NULL, 1, '2026-10-15 11:05:00'),
  (16, 10, 'Peter Kim', 'peter.kim@email.com', '0445678901', 4, '2026-10-16 15:40:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Quick sanity checks
-- ---------------------------------------------------------------------------
-- SELECT COUNT(*) AS events FROM events;
-- SELECT COUNT(*) AS registrations FROM registrations;
-- SELECT e.event_name, r.user_name, r.num_tickets, r.registration_date
-- FROM registrations r JOIN events e ON r.event_id = e.event_id
-- WHERE e.event_id = 2 ORDER BY r.registration_date DESC;
