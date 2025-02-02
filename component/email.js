import nodemailer from 'nodemailer';

// ------------------------------------------------------ สำหรับทดสอบ ---------------------------------------------------------
export const testconfigmail = (item) => {
    const { service, ipaddress, checkuser, user, apppass } = item;
    if (service === 'Other') {
        const address = ipaddress;
        const [host, port] = address.split(':');
        let transporter;
        if (checkuser) {
            transporter = nodemailer.createTransport({
                host: host, // ใส่ IP ของ SMTP server// ใส่ IP ของ SMTP server
                port: port, // ใส่พอร์ตของ SMTP server
                secure: false, // ไม่มีการเข้ารหัส
                tls: { rejectUnauthorized: false } // ในกรณีที่ไม่มีใบเซอร์
            });
        } else {
            transporter = nodemailer.createTransport({
                host: host, // ใส่ IP ของ SMTP server// ใส่ IP ของ SMTP server
                port: port, // ใส่พอร์ตของ SMTP server
                secure: false, // ใช้ true หากพอร์ตเป็น 465 (SSL)
                auth: {
                    user: user, // เปลี่ยนเป็นอีเมลของคุณ
                    pass: apppass,  // รหัสผ่านหรือ App Password
                },
            });
        }
        return transporter;
    } else {
        let transporter = nodemailer.createTransport({
            service: service, // หรือใช้ SMTP อื่น เช่น 'Yahoo', 'Outlook', หรือกำหนด host และ port เอง
            auth: {
                user: user, // เปลี่ยนเป็นอีเมลของคุณ
                pass: apppass,  // เปลี่ยนเป็นรหัสผ่านของคุณ (หรือตัว App Password หากใช้ Gmail)
            },
        });
        return transporter;
    }
};
 
export const testsendemail = (emailto, head, body, item) => {
    const { name, email } = item;
    let mailOptions = {
        from: `"${name}" <${email}>`,
        to: emailto,
        subject: head,
        html: body,
    };
     return mailOptions;
};

// ------------------------------------------------------ ใช้งานจริง ---------------------------------------------------------

export const configmail = (item) => {
   if (item[0].SettingsEmailService === 'Other') {
        const address = item[0].SettingsEmailIPAddress;
        const [host, port] = address.split(':');
        let transporter;
        if (item[0].SettingsEmailCheckUser) {
            transporter = nodemailer.createTransport({
                host: host, // ใส่ IP ของ SMTP server// ใส่ IP ของ SMTP server
                port: port, // ใส่พอร์ตของ SMTP server
                secure: false, // ไม่มีการเข้ารหัส
                tls: { rejectUnauthorized: false } // ในกรณีที่ไม่มีใบเซอร์
            });
        } else {
            transporter = nodemailer.createTransport({
                host: host, // ใส่ IP ของ SMTP server// ใส่ IP ของ SMTP server
                port: port, // ใส่พอร์ตของ SMTP server
                secure: false, // ใช้ true หากพอร์ตเป็น 465 (SSL)
                auth: {
                    user: item[0].SettingsEmailUser, // เปลี่ยนเป็นอีเมลของคุณ
                    pass: item[0].SettingsEmailApppass,  // รหัสผ่านหรือ App Password
                },
            });
        }
        return transporter;
   } else {
        let transporter = nodemailer.createTransport({
            service: item[0].SettingsEmailService, // หรือใช้ SMTP อื่น เช่น 'Yahoo', 'Outlook', หรือกำหนด host และ port เอง
            auth: {
                user: item[0].SettingsEmailUser, // เปลี่ยนเป็นอีเมลของคุณ
                pass: item[0].SettingsEmailApppass,  // เปลี่ยนเป็นรหัสผ่านของคุณ (หรือตัว App Password หากใช้ Gmail)
            },
        });
        return transporter;
   }
};

export const sendemail = (email, head, body, item) => {
    let mailOptions = {
        from: `"${item[0].SettingsEmailName}" <${item[0].SettingsEmailAddress}>`,
        to: email,
        subject: head,
        html: body,
    };
    return mailOptions;
};