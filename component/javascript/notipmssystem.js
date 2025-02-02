const Sendotp = (imageBuffer, to, subject, description, email, otp) => {
    // แปลง Buffer เป็น Base64
    const imageBase64 = imageBuffer.toString('base64');

    // สร้าง URL ของภาพในรูปแบบ data URI
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    // แทนที่ส่วนของภาพใน HTML ด้วย data URI ที่ได้
    const message = description.replace(/\/n/g, '<br>'); 

    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </head>

        <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
            <div style="max-width: 680px; margin: 0 auto; font-size: 14px; color: #434343;">
                <!-- ส่วนหัว -->
                <header style="background-color: #ffc107; height: 70px;">
                    <table style="width: 100%;">
                        <tbody>
                            <tr>
                                <td style="padding-top: 10px; padding-left: 30px;">
                                    <img alt="" src="${imageDataUrl}" height="45px" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </header>

                <!-- ส่วนตรงกลาง -->
                <main style="padding: 40px 30px">
                    <label style="font-weight: bold;">${subject}</label><br><br>
                    <label style="font-weight: bold;">${to} ${email}</label><br><br>
                    <label style="font-weight: bold;">${message}</label>
                </main>

                <!-- ส่วนด้านล่าง -->
                <footer style="width: 100%; margin: 20px auto 0; text-align: center; background-color: #2e2e2e; height: 60px;">
                    <label style="display: block; margin: 0; color: white; font-weight: bold; line-height: 60px;">
                        ©2024 Nok Airlines Public Company Limited. All Right Reserved.
                    </label>
                </footer>
            </div>
        </body>
    </html>
    `
}

export default Sendotp;
