import bcrypt from 'bcrypt';

const Insert = (connectdatabase) => {
    // เพิ่มข้อมูลสำหรับการทดสอบ
    const adduser = (data) => { 
        return new Promise((resolve, reject) => {
            const { nokid, nameen, nameth, position, evaluator, department, usertype, email, level } = data;
            const select = 'select * from Employee where EmployeeCode = ? or EmployeeEmail = ?';
            connectdatabase.query(select, [nokid, email], (erroruser, resultuser) => {
                if (erroruser) {
                    reject(erroruser);
                } else {
                    if (resultuser.length) {
                        resolve('user_exist')
                    } else {
                        bcrypt.hash(nokid, 10, (err, hash) => {
                            if (err) {
                                reject(err);
                            } else {
                                const sql = 'insert into Employee (EmployeeCode, EmployeeFullNameEN, EmployeeFullNameTH, EmployeePosition, SupervisorCode, DepartmentID, EmployeeUserType, EmployeeEmail, EmployeeLevel, EmployeePassword, EmployeeAnnotation) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                                connectdatabase.query(sql, [nokid, nameen, nameth, position, evaluator, department, usertype, email, level, hash, ''], (error, result) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        result.affectedRows === 1 ? resolve('register_success') : null;
                                    }
                                });
                            }
                        });
                    }
                }
            });
            
        });
    }

    // เพิ่มข้อมูลพนักงาน
    const addusercsv = (data) => {
        return new Promise((resolve, reject) => {
            const promises = data.map(data => {
                return new Promise(() => {
                    const select = 'select * from Employee where EmployeeCode = ? or EmployeeEmail = ?';
                    connectdatabase.query(select, [data[0], data[7]], (erroruser, resultuser) => {
                        if (erroruser) {
                            reject(erroruser);
                        } else {
                            if (resultuser.length) {
                                resolve('user_exist')
                            } else {
                                bcrypt.hash(data[0], 10, (err, hash) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        const sql = 'insert into Employee (EmployeeCode, EmployeeFullNameEN, EmployeeFullNameTH, EmployeePosition, SupervisorCode, DepartmentID, EmployeeUserType, EmployeeEmail, EmployeeLevel, EmployeePassword, EmployeeAnnotation) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                                        connectdatabase.query(sql, [data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7], data[8], hash, ''], (error, result) => {
                                            if (error) {
                                                reject(error);
                                            } else {
                                                result.affectedRows === 1 ? resolve('register_success') : null;
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                });
            });
    
            Promise.all(promises).then(() => { resolve('register_success'); }).catch(error => { reject(error); });
        });
    }

    // เพิ่มข้อมูลการประเมินในกรณีที่ไม่มีข้อมูลการประเมินนี้อยู่ในฐานข้อมูล
    const add_eval = (data) => {
        return new Promise((resolve, reject) => {
            const { level, topic, weight, description, part } = data;
            const sql = `insert into Part (PartTypeID, PartLevel, PartTopic, PartWeight, PartDescription) values (?, ?, ?, ?, ?)`;
            connectdatabase.query(sql, [part, level, topic, weight, description], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    result.affectedRows === 1 ? resolve('addtopic_success') : null;
                }
            })
        });
    }

    // เพิ่มข้อมูลกิจกรรม
    const add_event = (data, datetime) => {
        return new Promise((resolve, reject) => {
            const { topic, evaluate, description, startdate, enddate, statusdate } = data;
            const sql = 'insert into Event (EventTopic, EventEvaluate, EventDescription, EventStartDate, EventEndDate, EventStatusDate, EventSubmit) values (?, ?, ?, ?, ?, ?, ?)';
            connectdatabase.query(sql, [topic, evaluate, description, startdate, enddate, statusdate, datetime], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    result.affectedRows === 1 ? resolve('addevent_success') : null;
                }
            })

        });
    }

    const objectkey = (head, value) => {
        const result = [];
        if (head === 'id') {
            Object.keys(value).forEach(id => {
                let idpart = id.match(/\d+$/)[0];
                result.push(parseInt(idpart));
            });
        } else if (head === 'value') {
            Object.keys(value).forEach(id => result.push(value[id]));
        }
        return result;
    }

    // เมื่อมีการประเมินแล้วจะต้องบันทึกคะแนนลงไป 
    const add_evalscore = (item, datetime) => {
        const { data } = item;
        if (data.part === 'Part1' || data.part === 'Part2') {
            const partid = objectkey('id', data.rating);
            const rating = objectkey('value', data.rating);
            const comment = objectkey('value', data.comment);
            return new Promise((resolve, reject) => {
                const promises = partid.map((id, index) => {
                    return new Promise((resolve, reject) => {
                        const sql = `insert into ${data.part} (PartID, PartRating, PartComment, EmployeeCode, EvaluatorCode, PartType, PartSubmit) values (?, ?, ?, ?, ?, ?, ?)`;
                        connectdatabase.query(sql, [id, rating[index], comment[index], data.employeecode, data.evaluatorcode, data.type, datetime], (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                result.affectedRows === 1 ? resolve('saveeval_success') : null;
                            }
                        })
                    });
                });
                Promise.all(promises).then(() => { resolve('saveeval_success'); }).catch(error => { reject(error); });
            });
        } else if (data.part === 'Part3') {
            return new Promise((resolve, reject) => {
                const promises = data.strenght.map((_, index) => {
                    return new Promise((resolve, reject) => {
                        const sql = `insert into ${data.part} (PartStrenght, PartTopic, PartHTCG, PartPeriod, EmployeeCode, EvaluatorCode, PartType, PartSubmit) values (?, ?, ?, ?, ?, ?, ?, ?)`;
                        connectdatabase.query(sql, [data.strenght[index], data.topic[index], data.htcg[index], data.period[index], data.employeecode, data.evaluatorcode, data.type, datetime], (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                result.affectedRows === 1 ? resolve('saveeval_success') : null;
                            }
                        })
                    });
                });
                Promise.all(promises).then(() => { resolve('saveeval_success'); }).catch(error => { reject(error); });
            });
        } else if (data.part === 'Part4') {
            return new Promise((resolve, reject) => {
                const promises = data.impact.map((_, index) => {
                    return new Promise((resolve, reject) => {
                        const sql = `insert into ${data.part} (PartImpact, PartPO, PartPeriod, PartProjectDetail, EmployeeCode, EvaluatorCode, PartType, PartSubmit) values (?, ?, ?, ?, ?, ?, ?, ?)`;
                        connectdatabase.query(sql, [data.impact[index].value, data.po[index], data.period[index], data.project[index], data.employeecode, data.evaluatorcode, data.type, datetime], (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                result.affectedRows === 1 ? resolve('saveeval_success') : null;
                            }
                        })
                    });
                });
                Promise.all(promises).then(() => { resolve('saveeval_success'); }).catch(error => { reject(error); });
            });
        } else if (data.part === 'Part5') {
            const partid = objectkey('id', data.comment);
            const comment = objectkey('value', data.comment);
            return new Promise((resolve, reject) => {
                const promises = partid.map((id, index) => {
                    return new Promise((resolve, reject) => {
                        const sql = `insert into ${data.part} (PartID, PartComment, EmployeeCode, EvaluatorCode, PartType, PartSubmit) values (?, ?, ?, ?, ?, ?)`;
                        connectdatabase.query(sql, [id, comment[index], data.employeecode, data.evaluatorcode, data.type, datetime], (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                result.affectedRows === 1 ? resolve('saveeval_success') : null;
                            }
                        })
                    });
                });
                Promise.all(promises).then(() => { resolve('saveeval_success'); }).catch(error => { reject(error); });
            });
        }
    }

    return {
        adduser: adduser,
        addusercsv: addusercsv,
        add_eval: add_eval,
        add_event: add_event,
        add_evalscore: add_evalscore
    }
}

export default Insert;