import moment from 'moment';

const Datetime = () => {
    const currentDate = new Date(); // สร้างวัตถุ Date ปัจจุบัน
    const year = currentDate.getFullYear(); // รับปีปัจจุบัน
    const month = currentDate.getMonth() + 1; // รับเดือนปัจจุบัน (เริ่มจาก 0 เพราะฉะนั้นต้องบวกเพิ่มอีก 1)
    const date = currentDate.getDate(); // รับวันที่ปัจจุบัน
    const hours = currentDate.getHours(); // รับชั่วโมงปัจจุบัน
    const minutes = currentDate.getMinutes(); // รับนาทีปัจจุบัน
    const seconds = currentDate.getSeconds(); // รับวินาทีปัจจุบัน
    let formattedHours = hours < 10 ? '0' + hours : hours; // เซ็ทเมื่อตั้งแต่ 0 - 9 ชั่วโมง ให้เติม 0 ข้างหน้า
    let formattedMinutes= minutes < 10 ? '0' + minutes : minutes; // เซ็ทเมื่อตั้งแต่ 0 - 9 นาที ให้เติม 0 ข้างหน้า
    let formattedSeconds = seconds < 10 ? '0' + seconds : seconds; // เซ็ทเมื่อตั้งแต่ 0 - 9 วินาที ให้เติม 0 ข้างหน้า
    let formattedMonth = month < 10 ? '0' + month : month; // เซ็ทเมื่อตั้งแต่ 1 - 9 เดือน ให้เติม 0 ข้างหน้า
    let formattedDay = date < 10 ? '0' + date : date; // เซ็ทเมื่อตั้งแต่ 1 - 9 วัน ให้เติม 0 ข้างหน้า


    const dates = () => {
        return `${year}-${formattedMonth}-${formattedDay}`;
    }

    const time = () => {
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }

    return {
        dates: dates,
        time : time
    }
}

export default Datetime;