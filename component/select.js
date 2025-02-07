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
            const date = new Date();
            const month = date.getMonth() + 1; // getMonth() นับจาก 0-11
            const year = date.getFullYear();
            let period;
            month >= 4 && month <= 9 ? period = `1-${year}` : month >= 10 ? period = `2-${year}` : period = `2-${year - 1}`; // ตรวจสอบช่วงเดือนและกำหนดค่าให้ตัวแปร period
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
                                            const sql2 = 'select * from Part1 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql2, [employee.EmployeeCode, 'self', period], (error2, result2) => { if (error2) { reject(error2); } else { result2.forEach((data, index) => { ratingself1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingself1 = 5; dateselfpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Self
                                        const sql3Promise = new Promise((resolve, reject) => {
                                            const sql3 = 'select * from Part2 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql3, [employee.EmployeeCode, 'self', period], (error3, result3) => { if (error3) { reject(error3); } else { result3.forEach((data, index) => { ratingself2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingself2 = 5; dateselfpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Manager
                                        const sql4Promise = new Promise((resolve, reject) => {
                                            const sql4 = 'select * from Part1 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql4, [employee.EmployeeCode, 'manager', period], (error4, result4) => { if (error4) { reject(error4); } else { result4.forEach((data, index) => { ratingmanager1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingmanager1 = 5; datemanagerpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Manager
                                        const sql5Promise = new Promise((resolve, reject) => {
                                            const sql5 = 'select * from Part2 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql5, [employee.EmployeeCode, 'manager', period], (error5, result5) => { if (error5) { reject(error5); } else { result5.forEach((data, index) => { ratingmanager2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingmanager2 = 5; datemanagerpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
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
                                            const sql2 = 'select * from Part1 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql2, [employee.EmployeeCode, 'self', period], (error2, result2) => { if (error2) { reject(error2); } else { result2.forEach((data, index) => { ratingself1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingself1 = 5; dateselfpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Self
                                        const sql3Promise = new Promise((resolve, reject) => {
                                            const sql3 = 'select * from Part2 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql3, [employee.EmployeeCode, 'self', period], (error3, result3) => { if (error3) { reject(error3); } else { result3.forEach((data, index) => { ratingself2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingself2 = 5; dateselfpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Manager
                                        const sql4Promise = new Promise((resolve, reject) => {
                                            const sql4 = 'select * from Part1 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql4, [employee.EmployeeCode, 'manager', period], (error4, result4) => { if (error4) { reject(error4); } else { result4.forEach((data, index) => { ratingmanager1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingmanager1 = 5; datemanagerpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                        });
                                        // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Manager
                                        const sql5Promise = new Promise((resolve, reject) => {
                                            const sql5 = 'select * from Part2 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                            connectdatabase.query(sql5, [employee.EmployeeCode, 'manager', period], (error5, result5) => { if (error5) { reject(error5); } else { result5.forEach((data, index) => { ratingmanager2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingmanager2 = 5; datemanagerpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
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
                                return new Promise((resolve, reject) => {
                                    const sql2Promise = 'select * from Part1 inner join Employee on Employee.EmployeeCode = Part1.EmployeeCode inner join Department on Employee.DepartmentID = Department.DepartmentID where Employee.EmployeeCode = ? and PartType = ?';
                                    const sql3Promise = 'select * from Part2 inner join Employee on Employee.EmployeeCode = Part2.EmployeeCode inner join Department on Employee.DepartmentID = Department.DepartmentID where Employee.EmployeeCode = ? and PartType = ?';
                                    const sql4Promise = 'select * from Part3 where EmployeeCode = ? and PartType = ?';
                                    const sql5Promise = 'select * from Part5 where EmployeeCode = ? and PartType = ?';

                                    // ใช้ Promise.all เพื่อรันทั้งสอง query พร้อมกัน
                                    Promise.all([
                                        new Promise((resolve, reject) => {
                                            connectdatabase.query(sql2Promise, [employee.EmployeeCode, 'self'], (error, result) => {
                                                if (error) reject(error);
                                                else resolve(result);
                                            });
                                        }),
                                        new Promise((resolve, reject) => {
                                            connectdatabase.query(sql3Promise, [employee.EmployeeCode, 'self'], (error, result) => {
                                                if (error) reject(error);
                                                else resolve(result);
                                            });
                                        }),
                                        new Promise((resolve, reject) => {
                                            connectdatabase.query(sql2Promise, [employee.EmployeeCode, 'manager'], (error, result) => {
                                                if (error) reject(error);
                                                else resolve(result);
                                            });
                                        }),
                                        new Promise((resolve, reject) => {
                                            connectdatabase.query(sql3Promise, [employee.EmployeeCode, 'manager'], (error, result) => {
                                                if (error) reject(error);
                                                else resolve(result);
                                            });
                                        }),
                                        new Promise((resolve, reject) => {
                                            connectdatabase.query(sql4Promise, [employee.EmployeeCode, 'manager'], (error, result) => {
                                                if (error) reject(error);
                                                else resolve(result);
                                            });
                                        }),
                                        new Promise((resolve, reject) => {
                                            connectdatabase.query(sql5Promise, [employee.EmployeeCode, 'self'], (error, result) => {
                                                if (error) reject(error);
                                                else resolve(result);
                                            });
                                        })
                                    ])
                                    .then(([result2, result3, result4, result5, result6, result7]) => {
                                        let groupedData = {};
                                        // ฟังก์ชันช่วยรวมข้อมูลจาก Part1 และ Part2 และ Part 3 และ Part5
                                        const processResults = (data, partType, status) => {
                                            data.forEach(({ EmployeeID, EmployeeCode, EmployeeFullNameEN, EmployeeFullNameTH, EmployeePosition, SupervisorCode, EmployeeLevel, EmployeeUserType, PartStatus, PartRating, PartWeight, PartSubmit, DepartmentID, DepartmentName, PartStrenght, PartTopic, PartHTCG, PartPeriod, PartComment }) => {
                                                const key = `${PartStatus}-${EmployeeCode}`;
                                                if (!groupedData[key]) {
                                                    groupedData[key] = {
                                                        PartStatus,
                                                        EmployeeID,
                                                        EmployeeCode,
                                                        EmployeeFullNameEN,
                                                        EmployeeFullNameTH,
                                                        EmployeePosition,
                                                        EmployeeLevel,
                                                        EmployeeUserType,
                                                        Supervisor: SupervisorCode,
                                                        DepartmentID,
                                                        DepartmentName,
                                                        TotalPart1Self: 0,
                                                        TotalPart2Self: 0,
                                                        TotalPart1Manager: 0,
                                                        TotalPart2Manager: 0,
                                                        PartSubmit1: null,
                                                        PartSubmit2: null,
                                                        PartStrenght,
                                                        PartTopic,
                                                        PartHTCG,
                                                        PartPeriod,
                                                        PartComment
                                                    };
                                                }
                                                // คำนวณค่า TotalRating ตามประเภท
                                                if (partType === 'Part1') {
                                                    groupedData[key].PartSubmit1 = moment(PartSubmit).format('YYYY-MM-DD'); // เก็บค่า PartSubmit ของ Part1
                                                } else if (partType === 'Part2') {
                                                    groupedData[key].PartSubmit2 = moment(PartSubmit).format('YYYY-MM-DD'); // เก็บค่า PartSubmit ของ Part2
                                                }
                                                if (partType === 'Part1' && status === 'Self') {
                                                    groupedData[key].TotalPart1Self += (PartRating * PartWeight) / 100;
                                                } else if (partType === 'Part2' && status === 'Self') {
                                                    groupedData[key].TotalPart2Self += (PartRating * PartWeight) / 100;
                                                }
                                                if (partType === 'Part1' && status === 'Manager') {
                                                    groupedData[key].TotalPart1Manager += ((PartRating * PartWeight) / 100);

                                                } else if (partType === 'Part2' && status === 'Manager') {
                                                    groupedData[key].TotalPart2Manager += (PartRating * PartWeight) / 100;
                                                }
                                                if (partType === 'Part3') {
                                                    groupedData[key].PartStrenght = PartStrenght;
                                                    groupedData[key].PartTopic = PartTopic;
                                                    groupedData[key].PartHTCG = PartHTCG;
                                                    groupedData[key].PartPeriod = PartPeriod;
                                                }
                                                if (partType === 'Part3') {
                                                    if (!groupedData[key].PartStrenght) {
                                                        groupedData[key].PartStrenght = PartStrenght;
                                                    } else {
                                                        groupedData[key].PartStrenght += `: ${PartStrenght}`; // เชื่อมต่อคอมเมนต์เป็น String
                                                    }
                                                    if (!groupedData[key].PartTopic) {
                                                        groupedData[key].PartTopic = PartTopic;
                                                    } else {
                                                        groupedData[key].PartTopic += `: ${PartTopic}`; // เชื่อมต่อคอมเมนต์เป็น String
                                                    }
                                                    if (!groupedData[key].PartHTCG) {
                                                        groupedData[key].PartHTCG = PartHTCG;
                                                    } else {
                                                        groupedData[key].PartHTCG += `: ${PartHTCG}`; // เชื่อมต่อคอมเมนต์เป็น String
                                                    }
                                                    if (!groupedData[key].PartPeriod) {
                                                        groupedData[key].PartPeriod = PartPeriod;
                                                    } else {
                                                        groupedData[key].PartPeriod += `: ${PartPeriod}`; // เชื่อมต่อคอมเมนต์เป็น String
                                                    }
                                                }  
                                                if (partType === 'Part5') {
                                                    if (!groupedData[key].PartComment) {
                                                        groupedData[key].PartComment = PartComment;
                                                    } else {
                                                        groupedData[key].PartComment += `: ${PartComment}`; // เชื่อมต่อคอมเมนต์เป็น String
                                                    }
                                                }                                                                                              
                                                
                                            });
                                        };
                            
                                        // ประมวลผลข้อมูลจาก Part1 และ Part2
                                        processResults(result2, 'Part1', 'Self');
                                        processResults(result3, 'Part2', 'Self');
                                        processResults(result4, 'Part1', 'Manager');
                                        processResults(result5, 'Part2', 'Manager');
                                        processResults(result6, 'Part3', 'Manager');
                                        processResults(result7, 'Part5', 'Self');
                            
                                        // แปลง Object เป็น Array
                                        const finalResult = Object.values(groupedData);
                                        resolve(finalResult);
                                    })
                                    .catch(error => reject(error));
                                });
                            });
                            
                            // ใช้ Promise.all เพื่อรวมผลลัพธ์ทั้งหมด
                            Promise.all(promises)
                                .then(results => resolve(results))
                                .catch(err => console.error(err));
                            
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
                                        const sql2 = 'select * from Part1 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                        connectdatabase.query(sql2, [employee.EmployeeCode, 'self', period], (error2, result2) => { if (error2) { reject(error2); } else { result2.forEach((data, index) => { ratingself1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingself1 = 5; dateselfpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Self
                                    const sql3Promise = new Promise((resolve, reject) => {
                                        const sql3 = 'select * from Part2 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                        connectdatabase.query(sql3, [employee.EmployeeCode, 'self', period], (error3, result3) => { if (error3) { reject(error3); } else { result3.forEach((data, index) => { ratingself2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingself2 = 5; dateselfpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part1 และเวลาการประเมินของการประเมิน Part1 สำหรับ Manager
                                    const sql4Promise = new Promise((resolve, reject) => {
                                        const sql4 = 'select * from Part1 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                        connectdatabase.query(sql4, [employee.EmployeeCode, 'manager', period], (error4, result4) => { if (error4) { reject(error4); } else { result4.forEach((data, index) => { ratingmanager1 += (weightpart1[index].PartWeight * data.PartRating / 100); fullratingmanager1 = 5; datemanagerpart1 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
                                    });
                                    // ดึงตะแนนการประเมิน Part2 และเวลาการประเมินของการประเมิน Part2 สำหรับ Manager
                                    const sql5Promise = new Promise((resolve, reject) => {
                                        const sql5 = 'select * from Part2 where (EmployeeCode = ? and PartType = ?) and PartStatus = ?';
                                        connectdatabase.query(sql5, [employee.EmployeeCode, 'manager', period], (error5, result5) => { if (error5) { reject(error5); } else { result5.forEach((data, index) => { ratingmanager2 += (weightpart2[index].PartWeight * data.PartRating / 100); fullratingmanager2 = 5;  datemanagerpart2 = moment(data.PartSubmit).format('YYYY-MM-DD'); }); resolve(); }});
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
