import bcrypt from 'bcrypt';

const Update = (connectdatabase) => {
    // อัพเดทรหัสผ่านใหม่
    const updatepassword = (email, password) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    reject(err);
                } else {
                    const sql = 'update Employee set EmployeePassword = ? where EmployeeEmail = ?';
                    connectdatabase.query(sql, [hash, email], (error) => {
                        error ? reject(error) : resolve('success');
                    });
                }
            });
        });
    }

    // อัพเดทข้อมูลพนักงาน
    const updateuser = (data) => {
        return new Promise((resolve, reject) => {
            const { id, nokid, nameen, nameth, position, evaluator, department, usertype, email, level } = data;
            const sql = 'update Employee set EmployeeCode = ?, EmployeeFullNameEN = ?, EmployeeFullNameTH = ?, EmployeePosition = ?, SupervisorCode = ?, DepartmentID = ?, EmployeeUserType = ?, EmployeeEmail = ?, EmployeeLevel = ? where EmployeeID = ?';
            connectdatabase.query(sql, [nokid, nameen, nameth, position, evaluator, department, usertype, email, level, id], (error) => {
                error ? reject(error) : resolve('update_success');
            });
        });
    }

    // อัพเดทหมายเหตุว่าพนักงานคนนี้ไม่ได้ทำงานที่นี่แล้ว
    const updateuserdelete = (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'update Employee set EmployeeAnnotation = ? where EmployeeID = ?';
            connectdatabase.query(sql, ['deleteuser', id], (error) => {
                error ? reject(error) : resolve('delete_success');
            });
        });
    }

    // เปลี่ยนสถานะของ part นั้นว่าจะเปืดหรือปิดการประเมิน
    const changestatustype = (data) => {
        return new Promise((resolve, reject) => {
            const { part, statusname, status } = data;
            const sql = `update PartType set ${statusname} = ? where PartTypeID = ?`;
            connectdatabase.query(sql, [status, part], (error) => {
                error ? reject(error) : resolve('updatetstatustype_success');
            });
        });
    }

    // บันทึกไฟล์ลงไปยังเซิร์ฟเวอร์และบันทึกชื่อไฟล์ลงไปยังฐานข้อมูล
    const update_fileeval = (data) => {
        return new Promise((resolve, reject) => {
            const { parttypeid, namefiles, originalname } = data;
            const sql = `update PartType set ${namefiles} = ? where PartTypeID = ?`;
            connectdatabase.query(sql, [originalname, parttypeid], (error) => {
                error ? reject(error) : resolve('updatefileeval_success');
            });
        });
    }

    // อัพเดทข้อมูลการประเมินในกรณีที่มีข้อมูลอยู่แล้ว
    const update_eval = (data) => {
        return new Promise((resolve, reject) => {
            const { id, topic, weight, description } = data;
            const sql = `update Part set PartTopic = ?, PartWeight = ?, PartDescription = ? where PartID = ?`;
            connectdatabase.query(sql, [topic, weight, description, id], (error) => {
                error ? reject(error) : resolve('updatetopic_success');
            });
        });
    }

    // อัพเดทข้อมูลกิจกรรม
    const update_event = (data, datetime) => {
        return new Promise((resolve, reject) => {
            const { id, evaluate, topic, description, startdate, enddate, statusdate } = data;
            const sql = 'update Event set EventTopic = ?, EventEvaluate = ?, EventDescription = ?, EventStartDate = ?, EventEndDate = ?, EventStatusDate = ?, EventSubmit = ? where EventID = ?';
            connectdatabase.query(sql, [topic, evaluate, description, startdate, enddate, statusdate, datetime, id], (error) => {
                error ? reject(error) : resolve('updateevent_success');
            });
        });
    }

    // อัพเดทการตั้งต่า Email Service
    const updateemailservice= (data) => {
        return new Promise((resolve, reject) => {
            const { id, service, ipaddress, checkuser, user, apppass, email, name } = data;
            const sql = 'update Settings set SettingsEmailService = ?, SettingsEmailIPAddress = ?, SettingsEmailCheckUser = ?, SettingsEmailUser = ?, SettingsEmailApppass = ?, SettingsEmailAddress = ?, SettingsEmailName = ? where SettingsID = ?';
            connectdatabase.query(sql, [service, ipaddress, checkuser, user, apppass, email, name, id], (error) => {
                error ? reject(error) : resolve('updateemailservice_success');
            });
        });
    }

    // อัพเดทการตั้งต่าอีเมล
    const updateemailconfig = (id, to, subject, description) => {
        return new Promise((resolve, reject) => {
            const sql = 'update EmailConfig set EmailTo = ?, EmailSubject = ?, EmailDescription = ? where EmailID = ?';
            connectdatabase.query(sql, [to, subject, description, id], (error) => {
                error ? reject(error) : resolve('updateemailconfig_success');
            });
        });
    }

    return {
        updatepassword: updatepassword,
        updateuser: updateuser,
        updateuserdelete: updateuserdelete,
        changestatustype: changestatustype,
        update_fileeval: update_fileeval,
        update_eval: update_eval,
        update_event: update_event,
        updateemailservice: updateemailservice,
        updateemailconfig: updateemailconfig
    }
}

export default Update;