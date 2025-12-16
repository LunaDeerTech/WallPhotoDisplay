import nodemailer from 'nodemailer'

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  secure: boolean
}

export const sendEmail = async (config: SmtpConfig, to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
  })

  return info
}
