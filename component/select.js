import bcrypt from 'bcrypt';
import moment from 'moment';

const Select = (connectdatabase) => {
    // เข้าสู่ระบบ
    const login = (data) => {
        return new Promise((resolve, reject) => {
            const {emailornokid, password} = data;
            const sql = 'select * from Employee inner join Department on Employee.DepartmentID = Department.DepartmentID where (EmployeeEmail = ? or EmployeeCode = ?) and EmployeeAnnotation != ?';
            connectdatabase.query(sql, [emailornokid, emailornokid, 'deleteuser'], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    if (result.length) {
                        bcrypt.compare(password, result[0].EmployeePassword, (err, results) => {
                            err ? reject(err) : results ? resolve(result) : resolve('incorrect');
                        });
                    } else {
                        resolve('incorrect');
                    }
                }
            });
        });
    }

    // ดึงรูปแบบ Email มา
    const emailstyle = (keyword) => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from EmailConfig where EmailKeyword = ?';
            connectdatabase.query(sql, [keyword], (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : resolve(null);
            });
        });
    }

    // เช็ควันที่เปิด - ปิดการประเมิน
    const checkpms = (evaluate) => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Event where EventEvaluate = ?';
            connectdatabase.query(sql, [evaluate], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    if (result.length) {
                        const start = new Date(result[0].EventStartDate);
                        const end = new Date(result[0].EventEndDate);
                        const current = new Date(moment().format('YYYY-MM-DD'));
                        const now = current >= start && current <= end;
                        resolve(now);
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    }

    // ตรวจสอบว่า supervisor เป็น level อะไรเพื่อทำการตรวจเช็คเงื่อนไขของ event ได้
    const checksupervisor = (supervisor) => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Employee where EmployeeCode = ?';
            connectdatabase.query(sql, [supervisor], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    if (result.length) {
                        const results = result.map(row => ({ EmployeeLevel: row.EmployeeLevel }));
                        resolve(results);
                    } else {
                        resolve('no_supervisor');
                    }
                }
            });
        });
    }

    // ดึงข้อมูลจาก part การเช็คคะแนนของแต่ละ part
    const criteria = (data) => {
        return new Promise((resolve, reject) => {
            const { parttypeid, namefiles } = data
            const sql = `select PartTypeID, ${namefiles} as files from PartType where PartTypeID = ?`;
            connectdatabase.query(sql, [parttypeid], (error, result) => {
                error ? reject(error) : result.length ? resolve(result) : null;
            });
        });
    }

    // ดึงข้อมูลการประเมินทั้งหมด
    const part_eval = (data) => {
        return new Promise((resolve, reject) => {
            const { part, employeecode, evaluatorcode } = data;
            let sql;
            if (part === 'Part1' || part === 'Part2' || part === 'Part5') {
                sql = `select * from ${part} where EmployeeCode = ? and EvaluatorCode = ? order by PartID asc`;
            } else {
                sql = `select * from ${part} where EmployeeCode = ? and EvaluatorCode = ?`;
            }
            connectdatabase.query(sql, [employeecode, evaluatorcode], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    if (result.length) {
                        const currentDate = new Date(); // วันที่ปัจจุบัน
                        const currentYear = currentDate.getFullYear(); // ดึงปีปัจจุบัน
                        const currentMonth = currentDate.getMonth() + 1; // ดึงเดือนปัจจุบัน (0-11) จึงต้อง +1
                        const partSubmitDate = result[0].PartSubmit;
                        const partSubmitYear = partSubmitDate.getFullYear(); // ดึงปีจาก PartSubmit
                        const partSubmitMonth = partSubmitDate.getMonth() + 1; // ดึงเดือนจาก PartSubmit (0-11) จึงต้อง +1
                        // กำหนดรอบตามเดือนสำหรับวันที่ปัจจุบัน
                        const currentCycle = currentMonth >= 6 && currentMonth <= 8 ? `1-${currentYear}` : (currentMonth === 11 || currentMonth === 12 || currentMonth === 1 || currentMonth === 2) ? `2-${currentYear}` : null;
                        // กำหนดรอบตามเดือนสำหรับวันที่ใน PartSubmit
                        const partSubmitCycle = partSubmitMonth >= 6 && partSubmitMonth <= 8 ? `1-${partSubmitYear}` : (partSubmitMonth === 11 || partSubmitMonth === 12 || partSubmitMonth === 1 || partSubmitMonth === 2) ? `2-${partSubmitYear}` : null;
                        // เปรียบเทียบรอบทั้งสองและคืนค่า true หรือ false
                        resolve(currentCycle === partSubmitCycle ? result : 'no_score');
                    } else {
                        resolve('no_score'); // กรณีไม่มีข้อมูล
                    }
                }
            });
            
        });
    }

    // ดึงข้อมูล Part ทั้งหมด
    const get_part = (part, level) => {
        return new Promise((resolve, reject) => {
            const sql = 'select * from Part where PartTypeID = ? and PartLevel = ?';
            connectdatabase.query(sql, [part, level], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    // ดึงข้อมูลสำหรับการประเมินของหัวหน้าประเมินลูกน้อง
    const eval_score = (data) => {
        return new Promise(async (resolve, reject) => {
            const { supervisorcode, level, departmentid, page } = data;
            if (level === 'level_3' || level === 'level_4' || level === 'level_5') {
                if (page === 'manager') {
                    const sql1 = 'select * from Employee inner join Department on Employee.DepartmentID = Department.DepartmentID where (EmployeeCode = ? or SupervisorCode = ?) and EmployeeCode != ?';
                    connectdatabase.query(sql1, [supervisorcode, supervisorcode, 'nok0000'], (error1, result1) => {
                        if (error1) {
                            reject(error1);
                        } else {
                            if (result1.length) {
                                const promises = result1.map(employee => {
                                    return new Promise(async (resolve, reject) => {
                                        let fullratingself1 = 0, ratingself1 = 0, fullratingself2 = 0, ratingself2 = 0;
                                        let fullratingmanager1 = 0, ratingmanager1 = 0, fullratingmanager2 = 0, ratingmanager2 = 0;
                                        let namesupervisor = '';
                                        let dateselfpart1 = '', dateselfpart2 = '', dateselfpart3 = '', dateselfpart4 = '', dateselfpart5 = '';
                                        let datemanagerpart1 = '', datemanagerpart2 = '', datemanagerpart3 = '', datemanagerpart4 = '', datemanagerpart5 = '';
                                        const weightpart1 = await get_part('part1', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                        const weightpart2 = await get_part('part2', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                        // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Self
                                        const sql2Promise = new Promise((resolve, reject) => {
                                            const sql2 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql2, [employee.EmployeeCode, 'self'], (error2, result2) => { if (error2) { reject(error2); } else { result2.forEach((data, index) => { ratingself1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingself1 = 5; dateselfpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Self
                                        const sql3Promise = new Promise((resolve, reject) => {
                                            const sql3 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql3, [employee.EmployeeCode, 'self'], (error3, result3) => { if (error3) { reject(error3); } else { result3.forEach((data, index) => { ratingself2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingself2 = 5; dateselfpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Manager
                                        const sql4Promise = new Promise((resolve, reject) => {
                                            const sql4 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql4, [employee.EmployeeCode, 'manager'], (error4, result4) => { if (error4) { reject(error4); } else { result4.forEach((data, index) => { ratingmanager1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingmanager1 = 5; datemanagerpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Manager
                                        const sql5Promise = new Promise((resolve, reject) => {
                                            const sql5 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql5, [employee.EmployeeCode, 'manager'], (error5, result5) => { if (error5) { reject(error5); } else { result5.forEach((data, index) => { ratingmanager2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingmanager2 = 5; datemanagerpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        const sql6Promise = new Promise((resolve, reject) => {
                                            const sql6 = 'select * from Employee where EmployeeCode = ?';
                                            connectdatabase.query(sql6, [employee.SupervisorCode], (error6, result6) => { if (error6) { reject(error6);  } else { result6.forEach(data =>  namesupervisor = data.EmployeeFullNameEN); resolve(); }});
                                        });
    
                                        Promise.all([sql2Promise, sql3Promise, sql4Promise, sql5Promise, sql6Promise])
                                        .then(() => {
                                            const updatedEmployee = { 
                                                ...employee, NameSupervisor: namesupervisor, 
                                                PartRatingSelf1: ratingself1, FullRatingSelf1: fullratingself1, PartRatingSelf2: ratingself2, FullRatingSelf2: fullratingself2, 
                                                PartRatingManager1: ratingmanager1, FullRatingManager1: fullratingmanager1, PartRatingManager2: ratingmanager2, FullRatingManager2: fullratingmanager2,
                                                DateSelfPart1: dateselfpart1, DateSelfPart2: dateselfpart2, DateSelfPart3: dateselfpart3, DateSelfPart4: dateselfpart4, DateSelfPart5: dateselfpart5,
                                                DateManagerPart1: datemanagerpart1, DateManagerPart2: datemanagerpart2, DateManagerPart3: datemanagerpart3, DateManagerPart4: datemanagerpart4, DateManagerPart5: datemanagerpart5
                                            };
                                            resolve(updatedEmployee);
                                        })
                                        .catch(err => reject(err));
                                    });
                                });
                                Promise.all(promises).then(results => resolve(results)).catch(err => reject(err));
                            } else {
                                resolve([]); // ไม่มีผลลัพธ์
                            }
                        }
                    });
                } else if (page === 'staff') {
                    const sql1 = 'select * from Employee inner join Department on Employee.DepartmentID = Department.DepartmentID where Employee.DepartmentID = ? and EmployeeCode != ?';
                    connectdatabase.query(sql1, [departmentid, 'nok0000'], (error1, result1) => {
                        if (error1) {
                            reject(error1);
                        } else {
                            if (result1.length) {
                                const promises = result1.map(employee => {
                                    return new Promise(async (resolve, reject) => {
                                        let fullratingself1 = 0, ratingself1 = 0, fullratingself2 = 0, ratingself2 = 0;
                                        let fullratingmanager1 = 0, ratingmanager1 = 0, fullratingmanager2 = 0, ratingmanager2 = 0;
                                        let namesupervisor = '';
                                        let dateselfpart1 = '', dateselfpart2 = '', dateselfpart3 = '', dateselfpart4 = '', dateselfpart5 = '';
                                        let datemanagerpart1 = '', datemanagerpart2 = '', datemanagerpart3 = '', datemanagerpart4 = '', datemanagerpart5 = '';
                                        const weightpart1 = await get_part('part1', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                        const weightpart2 = await get_part('part2', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                        // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Self
                                        const sql2Promise = new Promise((resolve, reject) => {
                                            const sql2 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql2, [employee.EmployeeCode, 'self'], (error2, result2) => { if (error2) { reject(error2); } else { result2.forEach((data, index) => { ratingself1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingself1 = 5; dateselfpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Self
                                        const sql3Promise = new Promise((resolve, reject) => {
                                            const sql3 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql3, [employee.EmployeeCode, 'self'], (error3, result3) => { if (error3) { reject(error3); } else { result3.forEach((data, index) => { ratingself2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingself2 = 5; dateselfpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Manager
                                        const sql4Promise = new Promise((resolve, reject) => {
                                            const sql4 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql4, [employee.EmployeeCode, 'manager'], (error4, result4) => { if (error4) { reject(error4); } else { result4.forEach((data, index) => { ratingmanager1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingmanager1 = 5; datemanagerpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Manager
                                        const sql5Promise = new Promise((resolve, reject) => {
                                            const sql5 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                            connectdatabase.query(sql5, [employee.EmployeeCode, 'manager'], (error5, result5) => { if (error5) { reject(error5); } else { result5.forEach((data, index) => { ratingmanager2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingmanager2 = 5; datemanagerpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        const sql6Promise = new Promise((resolve, reject) => {
                                            const sql6 = 'select * from Employee where EmployeeCode = ?';
                                            connectdatabase.query(sql6, [employee.SupervisorCode], (error6, result6) => { if (error6) { reject(error6);  } else { result6.forEach(data =>  namesupervisor = data.EmployeeFullNameEN); resolve(); }});
                                        });

                                        Promise.all([sql2Promise, sql3Promise, sql4Promise, sql5Promise, sql6Promise])
                                        .then(() => {
                                            const updatedEmployee = { 
                                                ...employee, NameSupervisor: namesupervisor, 
                                                PartRatingSelf1: ratingself1, FullRatingSelf1: fullratingself1, PartRatingSelf2: ratingself2, FullRatingSelf2: fullratingself2, 
                                                PartRatingManager1: ratingmanager1, FullRatingManager1: fullratingmanager1, PartRatingManager2: ratingmanager2, FullRatingManager2: fullratingmanager2,
                                                DateSelfPart1: dateselfpart1, DateSelfPart2: dateselfpart2, DateSelfPart3: dateselfpart3, DateSelfPart4: dateselfpart4, DateSelfPart5: dateselfpart5,
                                                DateManagerPart1: datemanagerpart1, DateManagerPart2: datemanagerpart2, DateManagerPart3: datemanagerpart3, DateManagerPart4: datemanagerpart4, DateManagerPart5: datemanagerpart5
                                            };
                                            resolve(updatedEmployee);
                                        })
                                        .catch(err => reject(err));
                                    });
                                });
                                Promise.all(promises).then(results => resolve(results)).catch(err => reject(err));
                            } else {
                                resolve([]); // ไม่มีผลลัพธ์
                            }
                        }
                    });
                }
            } else if (page === 'dashboard') {
                const sql1 = 'select * from Employee inner join Department on Employee.DepartmentID = Department.DepartmentID where EmployeeCode != ?';
                connectdatabase.query(sql1, ['nok0000'], (error1, result1) => {
                    if (error1) {
                        reject(error1);
                    } else {
                        if (result1.length) {
                            const promises = result1.map(employee => {
                                return new Promise(async (resolve, reject) => {
                                    let fullratingself1 = 0, ratingself1 = 0, fullratingself2 = 0, ratingself2 = 0;
                                    let fullratingmanager1 = 0, ratingmanager1 = 0, fullratingmanager2 = 0, ratingmanager2 = 0;
                                    let namesupervisor = '';
                                    let dateselfpart1 = '', dateselfpart2 = '', dateselfpart3 = '', dateselfpart4 = '', dateselfpart5 = '';
                                    let datemanagerpart1 = '', datemanagerpart2 = '', datemanagerpart3 = '', datemanagerpart4 = '', datemanagerpart5 = ''; 
                                    const weightpart1 = await get_part('part1', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                    const weightpart2 = await get_part('part2', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                    // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Self
                                    const sql2Promise = new Promise((resolve, reject) => {
                                        const sql2 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql2, [employee.EmployeeCode, 'self'], (error2, result2) => { if (error2) { reject(error2); } else { result2.forEach((data, index) => { ratingself1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingself1 = 5; dateselfpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Self
                                    const sql3Promise = new Promise((resolve, reject) => {
                                        const sql3 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql3, [employee.EmployeeCode, 'self'], (error3, result3) => { if (error3) { reject(error3); } else { result3.forEach((data, index) => { ratingself2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingself2 = 5; dateselfpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Manager
                                    const sql4Promise = new Promise((resolve, reject) => {
                                        const sql4 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql4, [employee.EmployeeCode, 'manager'], (error4, result4) => { if (error4) { reject(error4); } else { result4.forEach((data, index) => { ratingmanager1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingmanager1 = 5; datemanagerpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Manager
                                    const sql5Promise = new Promise((resolve, reject) => {
                                        const sql5 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql5, [employee.EmployeeCode, 'manager'], (error5, result5) => { if (error5) { reject(error5); } else { result5.forEach((data, index) => { ratingmanager2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingmanager2 = 5;  datemanagerpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    const sql6Promise = new Promise((resolve, reject) => {
                                        const sql6 = 'select * from Employee where EmployeeCode = ?';
                                        connectdatabase.query(sql6, [employee.SupervisorCode], (error6, result6) => { if (error6) { reject(error6);  } else { result6.forEach(data =>  namesupervisor = data.EmployeeFullNameEN); resolve(); }});
                                    });

                                    Promise.all([sql2Promise, sql3Promise, sql4Promise, sql5Promise, sql6Promise])
                                    .then(() => {
                                        const updatedEmployee = { 
                                            ...employee, NameSupervisor: namesupervisor, 
                                            PartRatingSelf1: ratingself1, FullRatingSelf1: fullratingself1, PartRatingSelf2: ratingself2, FullRatingSelf2: fullratingself2, 
                                            PartRatingManager1: ratingmanager1, FullRatingManager1: fullratingmanager1, PartRatingManager2: ratingmanager2, FullRatingManager2: fullratingmanager2,
                                            DateSelfPart1: dateselfpart1, DateSelfPart2: dateselfpart2, DateSelfPart3: dateselfpart3, DateSelfPart4: dateselfpart4, DateSelfPart5: dateselfpart5,
                                            DateManagerPart1: datemanagerpart1, DateManagerPart2: datemanagerpart2, DateManagerPart3: datemanagerpart3, DateManagerPart4: datemanagerpart4, DateManagerPart5: datemanagerpart5
                                        };
                                        resolve(updatedEmployee);
                                    })
                                    .catch(err => reject(err));
                                });
                            });
                            Promise.all(promises).then(results => resolve(results)).catch(err => reject(err));
                        } else {
                            resolve([]); // ไม่มีผลลัพธ์
                        }
                    }
                });
            } else {
                const sql1 = 'select * from Employee inner join Department on Employee.DepartmentID = Department.DepartmentID where (EmployeeCode = ? or SupervisorCode = ?) and EmployeeCode != ?';
                connectdatabase.query(sql1, [supervisorcode, supervisorcode, 'nok0000'], (error1, result1) => {
                    if (error1) {
                        reject(error1);
                    } else {
                        if (result1.length) {
                            const promises = result1.map(employee => {
                                return new Promise(async (resolve, reject) => {
                                    let fullratingself1 = 0, ratingself1 = 0, fullratingself2 = 0, ratingself2 = 0;
                                    let fullratingmanager1 = 0, ratingmanager1 = 0, fullratingmanager2 = 0, ratingmanager2 = 0;
                                    let namesupervisor = '';
                                    let dateselfpart1 = '', dateselfpart2 = '', dateselfpart3 = '', dateselfpart4 = '', dateselfpart5 = '';
                                    let datemanagerpart1 = '', datemanagerpart2 = '', datemanagerpart3 = '', datemanagerpart4 = '', datemanagerpart5 = ''; 
                                    const weightpart1 = await get_part('part1', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                    const weightpart2 = await get_part('part2', employee.EmployeeLevel === 'level_5' || employee.EmployeeLevel === 'level_4' ? 'level_3' : employee.EmployeeLevel);
                                    // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Self
                                    const sql2Promise = new Promise((resolve, reject) => {
                                        const sql2 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql2, [employee.EmployeeCode, 'self'], (error2, result2) => { if (error2) { reject(error2); } else { result2.forEach((data, index) => { ratingself1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingself1 = 5; dateselfpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Self
                                    const sql3Promise = new Promise((resolve, reject) => {
                                        const sql3 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql3, [employee.EmployeeCode, 'self'], (error3, result3) => { if (error3) { reject(error3); } else { result3.forEach((data, index) => { ratingself2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingself2 = 5; dateselfpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Manager
                                    const sql4Promise = new Promise((resolve, reject) => {
                                        const sql4 = 'select * from Part1 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql4, [employee.EmployeeCode, 'manager'], (error4, result4) => { if (error4) { reject(error4); } else { result4.forEach((data, index) => { ratingmanager1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingmanager1 = 5; datemanagerpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Manager
                                    const sql5Promise = new Promise((resolve, reject) => {
                                        const sql5 = 'select * from Part2 where EmployeeCode = ? and PartType = ?';
                                        connectdatabase.query(sql5, [employee.EmployeeCode, 'manager'], (error5, result5) => { if (error5) { reject(error5); } else { result5.forEach((data, index) => { ratingmanager2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingmanager2 = 5;  datemanagerpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    const sql6Promise = new Promise((resolve, reject) => {
                                        const sql6 = 'select * from Employee where EmployeeCode = ?';
                                        connectdatabase.query(sql6, [employee.SupervisorCode], (error6, result6) => { if (error6) { reject(error6);  } else { result6.forEach(data =>  namesupervisor = data.EmployeeFullNameEN); resolve(); }});
                                    });

                                    Promise.all([sql2Promise, sql3Promise, sql4Promise, sql5Promise, sql6Promise])
                                    .then(() => {
                                        const updatedEmployee = { 
                                            ...employee, NameSupervisor: namesupervisor, 
                                            PartRatingSelf1: ratingself1, FullRatingSelf1: fullratingself1, PartRatingSelf2: ratingself2, FullRatingSelf2: fullratingself2, 
                                            PartRatingManager1: ratingmanager1, FullRatingManager1: fullratingmanager1, PartRatingManager2: ratingmanager2, FullRatingManager2: fullratingmanager2,
                                            DateSelfPart1: dateselfpart1, DateSelfPart2: dateselfpart2, DateSelfPart3: dateselfpart3, DateSelfPart4: dateselfpart4, DateSelfPart5: dateselfpart5,
                                            DateManagerPart1: datemanagerpart1, DateManagerPart2: datemanagerpart2, DateManagerPart3: datemanagerpart3, DateManagerPart4: datemanagerpart4, DateManagerPart5: datemanagerpart5
                                        };
                                        resolve(updatedEmployee);
                                    })
                                    .catch(err => reject(err));
                                });
                            });
                            Promise.all(promises).then(results => resolve(results)).catch(err => reject(err));
                        } else {
                            resolve([]); // ไม่มีผลลัพธ์
                        }
                    }
                });
            }
        });
    };
    
    return {
        login: login,
        emailstyle: emailstyle,
        checkpms: checkpms,
        checksupervisor: checksupervisor,
        criteria: criteria,
        part_eval: part_eval,
        eval_score: eval_score
    }
}

export default Select;
