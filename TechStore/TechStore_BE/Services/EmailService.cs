using System.Net.Mail;
using System.Net;

public class EmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var fromEmail = _config["Email:From"];
        var password = _config["Email:AppPassword"];

        Console.WriteLine("🚀 Đang gửi email đến: " + toEmail);
        Console.WriteLine("📧 From: " + fromEmail);
        Console.WriteLine("📌 Subject: " + subject);
        Console.WriteLine("📄 Body preview: " + body.Substring(0, Math.Min(100, body.Length)));

        var smtpClient = new SmtpClient("smtp.gmail.com")
        {
            Port = 587,
            Credentials = new NetworkCredential(fromEmail, password),
            EnableSsl = true,
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(fromEmail),
            Subject = subject,
            Body = body,
            IsBodyHtml = true,
        };
        mailMessage.To.Add(toEmail);

        try
        {
            await smtpClient.SendMailAsync(mailMessage);
            Console.WriteLine("✅ Gửi email thành công.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ Gửi email thất bại: " + ex.Message);
            throw;
        }
    }

}
