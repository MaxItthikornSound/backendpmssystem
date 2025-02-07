-- สร้างฐานข้อมูลชื่อว่า pmssystem
CREATE DATABASE pmssystem

-- ตั้งค่าฐานข้อมูลให้สามารถรองรับภาษาไทยได้
CHARACTER SET utf8 COLLATE utf8_general_ci;

-- เรียกใช้ฐานข้อมูลชื่อว่า pmssystem
USE pmssystem;

-- ตาราง Department (สำหรับอ้างอิงใน Employee)
CREATE TABLE Department (
    DepartmentID VARCHAR(5) NOT NULL PRIMARY KEY,
    DepartmentName VARCHAR(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Employee
CREATE TABLE Employee (
    EmployeeID INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    EmployeeCode VARCHAR(10) NOT NULL UNIQUE,
    EmployeeFullNameEN VARCHAR(255) NOT NULL,
    EmployeeFullNameTH VARCHAR(255) NOT NULL,
    EmployeePosition VARCHAR(100) NOT NULL,
    SupervisorCode VARCHAR(10),
    DepartmentID VARCHAR(5) NOT NULL,
    EmployeeUserType ENUM('user', 'admin') NOT NULL,
    EmployeeEmail VARCHAR(255) NOT NULL,
    EmployeeLevel ENUM('level_1', 'level_2', 'level_3', 'level_4', 'level_5'),
    EmployeePassword VARCHAR(255) NOT NULL,
    EmployeeAnnotation TEXT,
    FOREIGN KEY (DepartmentID) REFERENCES Department (DepartmentID),
    FOREIGN KEY (SupervisorCode) REFERENCES Employee (EmployeeCode)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง PartType (ประเภทของ Part)
CREATE TABLE PartType (
    PartTypeID VARCHAR(6) NOT NULL PRIMARY KEY,
    PartTypeName VARCHAR(255) NOT NULL,
    PartTypeQuestion TINYINT(1) NOT NULL,
    PartTypeStatusStaff TINYINT(1) NOT NULL,
    PartTypeStatusManager TINYINT(1) NOT NULL,
    PartTypeStatusHeadOf TINYINT(1) NOT NULL,
    PartTypeFileStaff TEXT,
    PartTypeFileManager TEXT,
    PartTypeFileHeadOf TEXT
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Part (หัวข้อของ Part)
CREATE TABLE Part (
    PartID INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    PartTypeID VARCHAR(6) NOT NULL,
    PartLevel VARCHAR(100) NOT NULL,
    PartTopic VARCHAR(255) NOT NULL,
    PartWeight INT,
    PartDescription TEXT NOT NULL,
    FOREIGN KEY (PartTypeID) REFERENCES PartType (PartTypeID)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Part1 (การเก็บคะแนนและความคิดเห็นใน Part1)
CREATE TABLE Part1 (
    PartNo INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    PartID INT NOT NULL,
    PartRating INT NOT NULL CHECK (PartRating BETWEEN 1 AND 5),
    PartComment TEXT NOT NULL,
    EmployeeCode VARCHAR(10) NOT NULL,
    EvaluatorCode VARCHAR(10) NOT NULL,
    PartType ENUM('self', 'manager'),
    PartSubmit DATETIME NOT NULL,
    PartStatus TEXT NOT NULL,
    FOREIGN KEY (PartID) REFERENCES Part (PartID),
    FOREIGN KEY (EmployeeCode) REFERENCES Employee (EmployeeCode),
    FOREIGN KEY (EvaluatorCode) REFERENCES Employee (EmployeeCode)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Part2 (การเก็บคะแนนและความคิดเห็นใน Part2)
CREATE TABLE Part2 (
    PartNo INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    PartID INT NOT NULL,
    PartRating INT NOT NULL CHECK (PartRating BETWEEN 1 AND 5),
    PartComment TEXT NOT NULL,
    EmployeeCode VARCHAR(10) NOT NULL,
    EvaluatorCode VARCHAR(10) NOT NULL,
    PartType ENUM('self', 'manager'),
    PartSubmit DATETIME NOT NULL,
    PartStatus TEXT NOT NULL,
    FOREIGN KEY (PartID) REFERENCES Part (PartID),
    FOREIGN KEY (EmployeeCode) REFERENCES Employee (EmployeeCode),
    FOREIGN KEY (EvaluatorCode) REFERENCES Employee (EmployeeCode)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Part3 (การเก็บคะแนนและความคิดเห็นใน Part3)
CREATE TABLE Part3 (
    PartNo INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    PartStrenght TEXT NOT NULL,
    PartTopic TEXT NOT NULL,
    PartHTCG TEXT NOT NULL,
    PartPeriod TEXT NOT NULL,
    EmployeeCode VARCHAR(10) NOT NULL,
    EvaluatorCode VARCHAR(10) NOT NULL,
    PartType ENUM('self', 'manager'),
    PartSubmit DATETIME NOT NULL,
    PartStatus TEXT NOT NULL,
    FOREIGN KEY (EmployeeCode) REFERENCES Employee (EmployeeCode),
    FOREIGN KEY (EvaluatorCode) REFERENCES Employee (EmployeeCode)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Part4 (การเก็บคะแนนและความคิดเห็นใน Part4)
CREATE TABLE Part4 (
    PartNo INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    PartImpact TEXT NOT NULL,
    PartPO TEXT NOT NULL,
    PartPeriod TEXT NOT NULL,
    PartProjectDetail TEXT NOT NULL,
    EmployeeCode VARCHAR(10) NOT NULL,
    EvaluatorCode VARCHAR(10) NOT NULL,
    PartType ENUM('self', 'manager'),
    PartSubmit DATETIME NOT NULL,
    PartStatus TEXT NOT NULL,
    FOREIGN KEY (EmployeeCode) REFERENCES Employee (EmployeeCode),
    FOREIGN KEY (EvaluatorCode) REFERENCES Employee (EmployeeCode)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Part5 (การเก็บคะแนนและความคิดเห็นใน Part5)
CREATE TABLE Part5 (
    PartNo INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    PartID INT NOT NULL,
    PartComment TEXT NOT NULL,
    EmployeeCode VARCHAR(10) NOT NULL,
    EvaluatorCode VARCHAR(10) NOT NULL,
    PartType ENUM('self', 'manager'),
    PartSubmit DATETIME NOT NULL,
    PartStatus TEXT NOT NULL,
    FOREIGN KEY (EmployeeCode) REFERENCES Employee (EmployeeCode),
    FOREIGN KEY (EvaluatorCode) REFERENCES Employee (EmployeeCode)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Event (กิจกรรมการประเมิน)
CREATE TABLE Event (
    EventID INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    EventTopic TEXT NOT NULL,
    EventEvaluate TEXT NOT NULL,
    EventDescription TEXT NOT NULL,
    EventStartDate DATE NOT NULL,
    EventEndDate DATE NOT NULL,
    EventStatusDate TEXT NOT NULL,
    EventSubmit DATETIME NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง Settings (การเก็บข้อมูลการตั้งค่า)
CREATE TABLE Settings (
    SettingsID INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    SettingsEmailService TEXT NOT NULL,
    SettingsEmailIPAddress TEXT,
    SettingsEmailCheckUser TINYINT,
    SettingsEmailUser TEXT NOT NULL,
    SettingsEmailApppass TEXT,
    SettingsEmailAddress TEXT NOT NULL,
    SettingsEmailName TEXT NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ตาราง EmailConfig (เก็ยข้อมูลการส่ง Email)
CREATE TABLE EmailConfig (
    EmailID INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    EmailTo TEXT NOT NULL,
    EmailSubject TEXT NOT NULL,
    EmailDescription TEXT NOT NULL,
    EmailKeyword TEXT NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- Insert ตัวอย่างข้อมูลใน Employee
INSERT INTO Employee (EmployeeID, EmployeeCode, EmployeeFullNameEN, EmployeeFullNameTH, EmployeePosition, SupervisorCode, DepartmentID, EmployeeUserType, EmployeeEmail, EmployeeLevel, EmployeeAnnotation, EmployeePassword) VALUES
(260, 'nok0000', 'Administrator', 'ผู้ดูแลระบบ', 'Admin', '-', '10000', 'admin', 'admin@gmail.com', 'level_5', '', '$2b$10$wPvd5DsrwjEdIMeZAwFsSOTJZdPwGqrp6o0OsRogbBJ3ATb.7GtBm');

-- Insert ตัวอย่างข้อมูลใน PartType
INSERT INTO PartType (PartTypeID, PartTypeName, PartTypeQuestion, PartTypeStatusStaff, PartTypeStatusManager, PartTypeStatusHeadOf) VALUES
('part1', 'Part 1', 0, 0, 0, 0),
('part2', 'Part 2', 0, 0, 0, 0),
('part3', 'Part 3', 0, 0, 0, 0),
('part4', 'Part 4', 0, 0, 0, 0),
('part5', 'Part 5', 0, 0, 0, 0);

-- Insert ตัวอย่างข้อมูลใน Settings
INSERT INTO Settings (SettingsEmailService, SettingsEmailAddress, SettingsEmailApppass, SettingsEmailName) VALUES
('Gmail', 'name@example.com', 'xxxx xxxx xxxx xxxx', 'FirstName Lastname');

-- Insert ตัวอย่างข้อมูลใน EmailConfig
INSERT INTO EmailConfig (EmailTo, EmailSubject, EmailDescription, EmailKeyword) VALUES
('เรียน', 'OTP สำหรับเปลี่ยนรหัสผ่าน', 'บริษัท สายการบินนกแอร์ จำกัด (มหาชน) /nใช้ OTP ต่อไปนี้เพื่อทำตามขั้นตอนการเปลี่ยนที่อยู่อีเมลของคุณให้เสร็จสิ้น/n OTP มีอายุ 5 นาที อย่าแบ่งปันรหัสนี้กับผู้อื่น', 'OTP'),
('เรียน', 'แจ้งเตือน: กรุณาประเมินตนเองในระบบ PMS ก่อนครบกำหนด', 'ระบบ PMS ของบริษัทได้แจ้งเตือนว่าท่านยังไม่ได้ดำเนินการประเมินตนเอง ซึ่งเป็นขั้นตอนสำคัญในการพัฒนาศักยภาพและวางแผนการทำงานร่วมกันเพื่อให้กระบวนการดำเนินงานเสร็จสมบูรณ์ กรุณาทำการประเมินตนเองภายในวันที่ [วันครบกำหนด] ขณะนี้เหลือเวลาอีก [วันที่เหลือ] วันก่อนสิ้นสุดการประเมิน /n/nท่านสามารถเข้าสู่ระบบเพื่อทำการประเมินได้ที่: www.pmssystem.nokair.co.th/n/nหากพบปัญหาในการใช้งานระบบหรือมีคำถามเพิ่มเติม กรุณาติดต่อฝ่ายทรัพยากรบุคคล/n/nขอขอบคุณสำหรับความร่วมมือ/n/nฝ่ายระบบบริหารงานบุคคล (PMS)/nบริษัท สายการบินนกแอร์ จำกัด (มหาชน)', 'Self'),
('เรียน', 'แจ้งเตือน: กรุณาประเมินผลการทำงานของพนักงานในระบบ PMS', 'ระบบ PMS ของบริษัทได้แจ้งเตือนว่าท่านยังไม่ได้ดำเนินการประเมินผลการทำงานของพนักงานในทีมบางส่วน ซึ่งเป็นขั้นตอนสำคัญในการสนับสนุนการพัฒนาและวางแผนศักยภาพทีมงาน/n/nกรุณาดำเนินการประเมินผลพนักงานภายในวันที่ [วันครบกำหนด] ขณะนี้เหลือเวลาอีก [วันที่เหลือ] วันก่อนสิ้นสุดการประเมิน/n/nสามารถเข้าสู่ระบบ PMS เพื่อทำการประเมินได้ที่: www.pmssystem.nokair.co.th/n/nหากท่านพบปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อฝ่ายทรัพยากรบุคคล/n/nขอขอบคุณสำหรับความร่วมมือในการสนับสนุนและพัฒนาทีมงานของท่าน/n/nฝ่ายระบบบริหารงานบุคคล (PMS)/nบริษัท สายการบินนกแอร์ จำกัด (มหาชน)', 'Staff');

-- Insert ตัวอย่างข้อมูลใน Department
INSERT INTO Department (DepartmentID, DepartmentName) VALUES
('10000', 'CEO Office'),
('11000', 'Corporate Safety, Security, and Quality'),
('12000', 'Corporate Strategy and BD'),
('13000', 'Technical'),
('14000', 'Information Technology'),
('15000', 'Cargo Sales and Operations'),
('16000', 'Procurement'),
('17000', 'Comsec and IR'),
('20000', 'CPO Office'),
('21000', 'Learning and Development'),
('22000', 'People and Administration'),
('30000', 'CCO Office'),
('31000', 'Planning'),
('32000', 'Revenue and Pricing'),
('33000', 'Digital Sales and Marketing'),
('34000', 'Sales and Distribution'),
('35000', 'Ancillary'),
('36000', 'Research'),
('37000', 'Commercial Management'),
('38000', 'Alliances and Distribution'),
('40000', 'COO Office'),
('41000', 'Flight Operations'),
('42000', 'Onboard Experience'),
('43000', 'Ground Operations and Services'),
('44000', 'Operations Control Center'),
('45000', 'Crew Planning and Movement'),
('50000', 'CFO Office'),
('51000', 'Finance'),
('52000', 'Accounting'),
('53000', 'Legal');
