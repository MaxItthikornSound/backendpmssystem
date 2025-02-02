const Delete = (connectdatabase) => {
    // ลบข้อมูลการประเมินในกรณีที่มีอยู่ในฐานข้อมูล
    const delete_eval = (id) => {
        return new Promise((resolve, reject) => {
            const sql = `delete from Part where PartID = ?`;
            connectdatabase.query(sql, [id], error => {
                error ? reject(error) : resolve('deletetopic_success');
            });
        });
    }

    // ลบกิจกรรมออก
    const delete_event = (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'delete from Event where EventID = ?';
            connectdatabase.query(sql, [id], error => {
                error ? reject(error) : resolve('deleteerror_success');
            })
        });
    }

    return {
        delete_eval: delete_eval,
        delete_event: delete_event
    }
}

export default Delete;