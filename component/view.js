import moment from 'moment';

const View = (connectdatabase) => {
    // ดึงข้อมูลแผนกทั้งหมด
    const department = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Department';
            connectdatabase.query(sql, (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : null;
            });
        });
    }

    // ดูข้อมูลพนักงานทั้งหมด (ไม่เอาคนที่ลบ)
    const users = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Employee inner join Department on Employee.DepartmentID = Department.DepartmentID  where EmployeeAnnotation != ?';
            connectdatabase.query(sql, ['deleteuser'], (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : resolve('no_user');
            });
        });
    }

    // ดูข้อมูลพนักงานทั้งหมด
    const user_all = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Employee where EmployeeCode != ?';
            connectdatabase.query(sql, ['nok0000'], (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : resolve('no_user');
            });
        });
    }

    // ดู Part ทั้งหมด
    const parttype = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from PartType';
            connectdatabase.query(sql, (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : null;
            });
        });
    }

    // ดูข้อมูลของ Part ทั้งหมด
    const part = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Part';
            connectdatabase.query(sql, (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : null;
            });
        });
    }

    // ดูกิจกรรมทั้งหมด
    const event = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Event';
            connectdatabase.query(sql, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    if (result.length) {
                        result.map(item => {
                            const formattedDate1 = moment(item.EventStartDate).format('D MMMM YYYY'); // ตัวอย่างรูปแบบวันที่
                            item.EventStartDate = formattedDate1;
                            const formattedDate2 = moment(item.EventEndDate).format('D MMMM YYYY'); // ตัวอย่างรูปแบบวันที่
                            item.EventEndDate = formattedDate2;
                        })
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    // การตั้งค่า Email Service
    const emailservice = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Settings';
            connectdatabase.query(sql, (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : resolve('no_settings');
            });
        });
    }

    // การเซ็ทข้อความเพื่อให้ส่ง OTP
    const confifemail = () => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from EmailConfig';
            connectdatabase.query(sql, (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : resolve('no_configemail');
            });
        });
    }

    // 
    const userspms = (type) => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Employee e where e.EmployeeCode != ? and (not exists (select 1 from Part1 p1 where e.EmployeeCode = p1.EmployeeCode and p1.PartType = ?) or not exists (select 1 from Part2 p2 where e.EmployeeCode = p2.EmployeeCode and p2.PartType = ?))';
            connectdatabase.query(sql, ['nok0000', type, type], (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : resolve('no_pmssystem');
            });
        });
    }

    return {
        department: department,
        users: users,
        user_all: user_all,
        parttype: parttype,
        part: part,
        event: event,
        emailservice: emailservice,
        confifemail: confifemail,
        userspms: userspms
    }
}

export default View