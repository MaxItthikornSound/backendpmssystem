import express from 'express';
import cors from 'cors';
import bodyparser from 'body-parser';
import mysql from 'mysql';
import { configDotenv } from 'dotenv';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import moment from 'moment';

// กำหนดที่เก็บไฟล์
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// เรียกไฟล์จาก component
import Select from './component/select.js'; // คำสั่ง select สำหรับมีเงื่อนไข
import Insert from './component/insert.js';
import Update from './component/update.js';
import View from './component/view.js'; // คำสั่ง select สำหรับไม่มีเงื่อนไข
import Delete from './component/delete.js';
import Datetime from './component/datetime.js';
import { testconfigmail, testsendemail, configmail, sendemail } from './component/email.js'; // สำหรบการส่ง email โดยใช้ nodemaller

// ไฟล์ html ที่นำเข้ามาใส่ในตัวแปรเพื่อทำการส่งไปยัง nodemaller
import Sendotp from './component/javascript/sendotp.js';

configDotenv();
const ipaddress = process.env.IPADDRESS;
const app = express();
const port = 443;
app.use(express.static('criteria'));


app.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', ipaddress);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
})
app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cors());

// ------------------------- Connect Database -------------------------------
const connectdatabase = mysql.createConnection({ host: process.env.HOST, user: process.env.USER, password: process.env.PASSWORD, database: process.env.DATABASE, timezone: process.env.TIMEZONE });
connectdatabase.connect((err) => err ? console.error('Connection error Please try again.') : null);

// -------------------------- ส่งเมลอัตโนมัติ -------------------------------------------------
const sevendayemail = async () => {
    const event = await View(connectdatabase).event();

    if (event) {
        event.map(data => {
            // แปลงวันที่ให้เป็น Moment object และรีเซ็ตเวลาเป็น 00:00:00
            const startDate = moment(data.EventStartDate, 'D MMMM YYYY').startOf('day');
            const endDate = moment(data.EventEndDate, 'D MMMM YYYY').endOf('day');
    
            // วันที่ปัจจุบันและรีเซ็ตเวลาเป็น 00:00:00
            const currentDate = moment().startOf('day');
    
            // ตรวจสอบว่าเหตุการณ์ยังคงอยู่ในช่วงเวลาที่กำหนดหรือไม่
            if (currentDate.isBetween(startDate, endDate, null, '[]')) {
                // คำนวณวันก่อนกำหนด (7 วันก่อน endDate)
                const sevenDaysBeforeEnd = endDate.clone().subtract(7, 'days');
    
                // ตั้งเวลาให้เป็น 7:00 AM ของวันที่ 7 วันก่อนกำหนด
                const emailSendTime = sevenDaysBeforeEnd.set({ hour: 7, minute: 0, second: 0, millisecond: 0 });
    
                // ตรวจสอบว่าปัจจุบันเวลาเกินเวลาที่กำหนดสำหรับการส่งอีเมลหรือยัง
                const currentTime = moment();
    
                // ถ้าปัจจุบันอยู่ก่อนเวลาในการส่งอีเมล
                if (currentTime.isBefore(emailSendTime)) {
                    // ตั้งค่า cron job สำหรับส่งอีเมลตอน 7:00 AM
                    cron.schedule('0 7 * * *', async () => {
                        const currentTime = moment();
                        if (currentTime.isSameOrAfter(emailSendTime)) {
                            const body = 'แจ้งเตือนการประเมิน';
                            const result_view_email_service = await View(connectdatabase).emailservice();
                            const fileBuffer = fs.readFileSync('component/javascript/logofull_30_01_68_02_40_00.png');
                            const result_emailstyle_self = await Select(connectdatabase).emailstyle('self');
                            const result_self = await View(connectdatabase).userspms('self');
                            result_self.map(async data => {
                                await configmail(result_view_email_service).sendMail(sendemail(data.EmployeeEmail, body, Sendotp(fileBuffer, result_emailstyle_self[0].EmailTo, result_emailstyle_self[0].EmailSubject, result_emailstyle_self[0].EmailDescription, data.EmployeeEmail, '123456'), result_view_email_service));
                            });
                            const result_emailstyle_staff = await Select(connectdatabase).emailstyle('staff');
                            const result_staff = await View(connectdatabase).userspms('staff');
                            result_staff.map(async data => {
                                await configmail(result_view_email_service).sendMail(sendemail(data.EmployeeEmail, body, Sendotp(fileBuffer, result_emailstyle_staff[0].EmailTo, result_emailstyle_staff[0].EmailSubject, result_emailstyle_staff[0].EmailDescription, data.EmployeeEmail, '123456'), result_view_email_service));
                            });
                        }
                    });
                }
            }
        });
    }
}
sevendayemail();

// ------------------------- All Data -------------------------------
// เข้าสู่ระบบสำหรับการประเมิน
app.post(process.env.LOGINUSER, async (req, res) => {
    const result_login = await Select(connectdatabase).login(req.body);
    if (result_login === 'incorrect') {
        res.send({ auth: false });
    } else {
        const token = jwt.sign({ EmployeeCode: result_login[0].EmployeeCode, EmployeeFullNameEN: result_login[0].EmployeeFullNameEN, EmployeeUserType: result_login[0].EmployeeUserType, EmployeeLevel: result_login[0].EmployeeLevel, EmployeePosition: result_login[0].EmployeePosition, DepartmentID: result_login[0].DepartmentID, DepartmentName: result_login[0].DepartmentName, SupervisorCode: result_login[0].SupervisorCode }, process.env.SECRET_KEY, { expiresIn: '1h' });
        res.send({ auth: true, token });
    }
});

// รับอีเมลจาก User เพื่อทำการส่ง Email ที่ทีหมายเลข OTP ไป
const otpStorage = {};
app.post(process.env.SENDEMAIL, async (req, res) => {
    try {
        const email = req.body.email;
        const select = 'select * from Employee where EmployeeEmail = ?';
        connectdatabase.query(select, [email], async (error, result) => {
            if (error) {
                res.status(500).send(error);
            } else {
                if (result.length) {
                    const otp = Math.floor(100000 + Math.random() * 900000);
                    const expirationTime = Date.now() + 5 * 60 * 1000;
                    otpStorage[email] = { otp, expirationTime };
                    // ส่งอีเมล
                    try {
                        const body = 'OTP Verification';
                        const result_view_email_service = await View(connectdatabase).emailservice();
                        const result_emailstyle = await Select(connectdatabase).emailstyle('OTP');
                        const fileBuffer = fs.readFileSync('component/javascript/logofull_30_01_68_02_40_00.png');
                        await configmail(result_view_email_service).sendMail(sendemail(email, body, Sendotp(fileBuffer, result_emailstyle[0].EmailTo, result_emailstyle[0].EmailSubject, result_emailstyle[0].EmailDescription, email, otp), result_view_email_service));
                        res.send('success');
                    } catch (error) {
                        res.status(500).send(error);
                    }
                } else {
                    res.send('email not exist');
                }
            }
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ตรวจสอบหมายเลข OTP ที่ได้รับจาก User ว่าตรงกันหรือไม่
app.post(process.env.SENDOTP, async (req, res) => {
    try {
        if (otpStorage[req.body.email]) {
            if (otpStorage[req.body.email].otp === parseInt(req.body.otp)) {
                res.send('success');
            } else {
                res.send('otp failed');
            }
        } else {
            res.send('not found email');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// เปลี่ยนรหัสผ่านของ User ใหม่ ในกรณีที่ได้ OTP แล้วตรวจสอบ OTP ถูกต้อง
app.post(process.env.CREATENEWPASSWORD, async (req, res) => {
    try {
        const result_createnewoassword = await Update(connectdatabase).updatepassword(req.body.email, req.body.password);
        res.send(result_createnewoassword);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------- User Data -------------------------------
// เช็ควันที่เปิด - ปิดการประเมิน
app.post(process.env.CHECK_PMS, async (req, res) => {
    try {
        const result_checkpms = await Select(connectdatabase).checkpms(req.body.evaluate);
        res.send(result_checkpms);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ตรวจสอบว่า supervisor เป็น level อะไรเพื่อทำการตรวจเช็คเงื่อนไขของ event ได้
app.post(process.env.CHECK_SUPERVISOR, async (req, res) => {
    try {
        const result_checksupervisor = await Select(connectdatabase).checksupervisor(req.body.supervisor);
        res.send(result_checksupervisor);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดุเกณฑ์การประเมินในแต่ละ part และแต่ละ level
app.post(process.env.CRITERIA, async (req, res) => {
    try {
        const result_criteria = await Select(connectdatabase).criteria(req.body);
        if (result_criteria[0].files) {
            const filePath = path.join(result_criteria[0].files); // ไฟล์ PDF
            res.sendFile(filePath, { root: path.join('criteria') });
        } else {
            res.send('no_criteria');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดึงข้อมูลจาก part
app.post(process.env.VIEW_EVAL_PART, async (req, res) => {
    try {
        const result_view_eval_part = await Select(connectdatabase).part_eval(req.body);
        res.send(result_view_eval_part);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// บันทึกการประเมินทั้ง 5 Part
app.post(process.env.SAVE_EVAL_PART, async (req, res) => {
    try {
        const result_add_eval_part = await Insert(connectdatabase).add_evalscore(req.body, `${Datetime().dates() + ' ' + Datetime().time()}`);
        res.send(result_add_eval_part);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    } 
});

// ดึงข้อมูลสำหรับการประเมินของหัวหน้าประเมินลูกน้อง
app.post(process.env.VIEW_EVAL_SCORE, async (req, res) => {
    try {
        const result_view_eval_manager = await Select(connectdatabase).eval_score(req.body);
        res.send(result_view_eval_manager);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------- Admin Data -------------------------------
// ดึงข้อมลแผนกทั้งหมด
app.get(process.env.GET_DEPARTMENT, async (_, res) => {
    try {
        const result_department = await View(connectdatabase).department();
        res.send(result_department);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// เพิ่มข้อมูลหนักงาน
app.post(process.env.ADD_USER, upload.none(), async (req, res) => {
    try {
        const result_user = await Insert(connectdatabase).adduser(req.body);
        res.send(result_user);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
})

// เพิ่มข้อมูลพนักงานแบบ CSV
app.post(process.env.ADD_USER_CSV, upload.none(), async (req, res) => {
    try {
        const result_user = await Insert(connectdatabase).addusercsv(req.body);
        res.send(result_user);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
})

// แก้ไขข้อมูลหนักงาน
app.put(process.env.UPDATE_USER, upload.none(), async (req, res) => {
    try {
        const result_updateuser = await Update(connectdatabase).updateuser(req.body);
        res.send(result_updateuser);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดูข้อมูลของพนักงานทั้งหมดและสามารถค้นหา NOKID ได้
app.get(process.env.VIEW_USER, async (_, res) => {
    try {
        const result_user = await View(connectdatabase).users();
        res.send(result_user);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดูข้อมูลของพนักงานทั้งหมดและสามารถค้นหา NOKID ได้
app.get(process.env.VIEW_USER_ALL, async (_, res) => {
    try {
        const result_user = await View(connectdatabase).user_all();
        res.send(result_user);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ลบข้อมูลพนักงาน (ทำหมายเหคุไว้ ไม่ได้ลบข้อมูลจริงออก)
app.delete(process.env.DELETE_USER, async (req, res) => {
    try {
        const result_deleteuser = await Update(connectdatabase).updateuserdelete(req.query.id);
        res.send(result_deleteuser);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดู Part ทั้งหมด
app.get(process.env.PART_TYPE, async (_, res) => {
    try {
        const result_part = await View(connectdatabase).parttype();
        res.send(result_part);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// เปลี่ยนสถานะของ part นั้นว่าจะเปืดหรือปิดการประเมิน
app.put(process.env.CHANGE_STATUS_TYPE, async (req, res) => {
    try {
        const result_changestatustype = await Update(connectdatabase).changestatustype(req.body);
        res.send(result_changestatustype);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดูข้อมูลของ Part ทั้งหมด
app.get(process.env.PART, async (_, res) => {
    try {
        const result_part = await View(connectdatabase).part();
        res.send(result_part);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// บันทึกไฟล์ลงไปยังเซิร์ฟเวอร์และบันทึกชื่อไฟล์ลงไปยังฐานข้อมูล
app.post(process.env.SAVE_FILE_EVAL, upload.single('files'), async (req, res) => {
    try {
        const result_update_fileeval = await Update(connectdatabase).update_fileeval(req.body);
        if (result_update_fileeval === 'updatefileeval_success') {
            const filepath = 'criteria/' + req.body.originalname;
            fs.writeFileSync(filepath, req.file.buffer);
            if (req.body.namefilescurrent && req.body.namefilescurrent !== 'null') {
                fs.rmSync('criteria/' + req.body.namefilescurrent);
            }
            res.send(result_update_fileeval);
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ลบไฟล์ออกจากเซิร์ฟเวอร์และลบชื่อไฟล์ออกจากฐานข้อมูล
app.delete(process.env.DELETE_FILE_EVAL, async (req, res) => {
    try {
        const result_update_fileeval = await Update(connectdatabase).update_fileeval(req.query);
        if (result_update_fileeval === 'updatefileeval_success') {
            fs.rmSync('criteria/' + req.query.namefilescurrent);
            res.send('deletefileeval_success');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// เพิ่มข้อมูลการประเมินในกรณีที่ไม่มีข้อมูลการประเมินนี้อยู่ในฐานข้อมูล
app.post(process.env.ADD_EVAL, async (req, res) => {
    try {
        const result_update_eval = await Insert(connectdatabase).add_eval(req.body);
        res.send(result_update_eval);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// อัพเดทข้อมูลการประเมินในกรณีที่มีข้อมูลอยู่แล้ว
app.put(process.env.UPDATE_EVAL, async (req, res) => {
    try {
        const result_update_eval = await Update(connectdatabase).update_eval(req.body);
        res.send(result_update_eval);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ลบข้อมูลการประเมินในกรณีที่มีอยู่ในฐานข้อมูล
app.delete(process.env.DELETE_EVAL, async (req, res) => {
    try {
        const { id, part } = req.query;
        const result_delete_eval = await Delete(connectdatabase).delete_eval(id, part);
        res.send(result_delete_eval);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดูกิจกรรมทั้งหมด
app.get(process.env.VIEW_EVENT, async (_, res) => {
    try {
        const result_view_event = await View(connectdatabase).event();
        res.send(result_view_event);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// เพิ่มข้อมูลกิจกรรม
app.post(process.env.ADD_EVENT, async (req, res) => {
    try {
        const result_add_event = await Insert(connectdatabase).add_event(req.body, `${Datetime().dates() + ' ' + Datetime().time()}`);
        sevendayemail();
        res.send(result_add_event);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// อัพเดทข้อมูลกิจกรรม
app.put(process.env.UPDATE_EVENT, async (req, res) => {
    try {
        const result_update_eval = await Update(connectdatabase).update_event(req.body, `${Datetime().dates() + ' ' + Datetime().time()}`);
        sevendayemail();
        res.send(result_update_eval);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ลบกิจกรรมออก
app.delete(process.env.DELETE_EVENT, async (req, res) => {
    try {
        const result_delete_event = await Delete(connectdatabase).delete_event(req.query.id);
        sevendayemail();
        res.send(result_delete_event);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดูการตั้งค่าอีเมลที่ต้องส่ง
app.get(process.env.VIEW_EMAIL_SERVICE, async (_, res) => {
    try {
        const result_view_email_service = await View(connectdatabase).emailservice();
        res.send(result_view_email_service);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดูการตั้งค่าอีเมลที่ต้องส่ง
app.post(process.env.TEST_EMAIL_SERVICE, async (req, res) => {
    try {
        await testconfigmail(req.body).sendMail(testsendemail(req.body.emailto, 'Test SMTP Email Service', req.body.description, req.body));
        res.send('success');
    } catch (error) {
        res.send('failed');
    }
});

// อัพเดทการตั้งค่าอีเมลที่ต้องส่ง
app.put(process.env.UPDATE_EMAIL_SERVICE, async (req, res) => {
    try {
        const result_email_service = await Update(connectdatabase).updateemailservice(req.body);
        res.send(result_email_service);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ดูการตั้งค่าการส่งข้อความด้วยอีเมล
app.get(process.env.VIEW_CONFIG_EMAIL, async (_, res) => {
    try {
        const result_view_config_email = await View(connectdatabase).confifemail();
        res.send(result_view_config_email);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// อัพเดทข้อมูลการประเมินในกรณีที่มีข้อมูลอยู่แล้ว
app.put(process.env.UPDATE_CONFIG_EMAIL, async (req, res) => {
    try {
        const { id, to, subject, description } = req.body;
        const result_email_config = await Update(connectdatabase).updateemailconfig(id, to, subject, description);
        res.send(result_email_config);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------- Run Server Express -------------------------------
app.listen(port, () => console.log(`Server ON Port ${port}`));