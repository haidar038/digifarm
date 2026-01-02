// Email templates for RINDANG (DigiFarm)

export interface WelcomeEmailData {
    full_name: string;
    email: string;
    temp_password: string;
    role: string;
    app_url: string;
}

/**
 * Generate welcome email HTML template
 * Note: Template is minified to avoid quoted-printable encoding issues (=20 artifacts)
 */
export function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    const roleLabels: Record<string, string> = {
        farmer: "Petani",
        manager: "Manager",
        observer: "Observer",
        admin: "Administrator",
    };

    const roleLabel = roleLabels[data.role] || data.role;
    const year = new Date().getFullYear();

    // Template without trailing whitespace to avoid =20 in quoted-printable encoding
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Selamat Datang di RINDANG</title>
<style>
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333333;margin:0;padding:0;background-color:#f4f4f4}
.container{max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)}
.header{background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:white;padding:30px 20px;text-align:center}
.header h1{margin:0;font-size:28px;font-weight:600}
.header p{margin:10px 0 0;opacity:0.9;font-size:14px}
.content{padding:30px}
.greeting{font-size:18px;margin-bottom:20px}
.info-box{background-color:#f8fafc;border-left:4px solid #16a34a;padding:15px 20px;margin:20px 0;border-radius:4px}
.info-box h3{margin:0 0 10px;color:#16a34a;font-size:14px;text-transform:uppercase;letter-spacing:0.5px}
.info-item{margin:8px 0}
.info-label{color:#64748b;font-size:13px}
.info-value{color:#1e293b;font-weight:600;font-size:15px}
.warning{background-color:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0}
.warning-icon{color:#f59e0b;font-weight:bold}
.button-container{text-align:center;margin:30px 0}
.button{display:inline-block;background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:white !important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px}
.features{margin:25px 0;padding:0}
.feature-item{display:flex;align-items:flex-start;margin:12px 0}
.feature-icon{color:#16a34a;margin-right:10px;font-size:18px}
.footer{background-color:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0}
.footer a{color:#16a34a;text-decoration:none}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>Selamat Datang di RINDANG!</h1>
<p>Sistem Informasi Manajemen Pertanian Digital</p>
</div>
<div class="content">
<p class="greeting">Halo <strong>${data.full_name}</strong>,</p>
<p>Akun Anda sebagai <strong>${roleLabel}</strong> telah berhasil dibuat. Anda sekarang dapat mengakses RINDANG untuk mengelola dan memantau aktivitas pertanian.</p>
<div class="info-box">
<h3>Informasi Login</h3>
<div class="info-item">
<span class="info-label">Email:</span><br>
<span class="info-value">${data.email}</span>
</div>
<div class="info-item">
<span class="info-label">Password Sementara:</span><br>
<span class="info-value">${data.temp_password}</span>
</div>
</div>
<div class="warning">
<p style="margin:0"><strong>Penting:</strong> Anda akan diminta untuk mengganti password saat login pertama kali demi keamanan akun Anda.</p>
</div>
<div class="button-container">
<a href="${data.app_url}/login" class="button">Login Sekarang</a>
</div>
<p><strong>Fitur yang dapat Anda akses:</strong></p>
<div class="features">
<div class="feature-item">
<span class="feature-icon">*</span>
<span>Kelola data lahan dan produksi pertanian</span>
</div>
<div class="feature-item">
<span class="feature-icon">*</span>
<span>Lihat analitik dan laporan produktivitas</span>
</div>
<div class="feature-item">
<span class="feature-icon">*</span>
<span>Pantau prakiraan cuaca dan rekomendasi</span>
</div>
<div class="feature-item">
<span class="feature-icon">*</span>
<span>Terima notifikasi panen dan aktivitas</span>
</div>
</div>
<p style="color:#64748b;font-size:14px">Jika Anda memiliki pertanyaan atau membutuhkan bantuan, silakan hubungi administrator sistem.</p>
</div>
<div class="footer">
<p>Email ini dikirim oleh sistem RINDANG.</p>
<p>&copy; ${year} RINDANG - Sistem Informasi Manajemen Pertanian Digital</p>
</div>
</div>
</body>
</html>`;

    return html;
}

/**
 * Generate welcome email plain text
 */
export function generateWelcomeEmailText(data: WelcomeEmailData): string {
    const roleLabels: Record<string, string> = {
        farmer: "Petani",
        manager: "Manager",
        observer: "Observer",
        admin: "Administrator",
    };

    const roleLabel = roleLabels[data.role] || data.role;

    return `Selamat Datang di RINDANG!
==========================

Halo ${data.full_name},

Akun Anda sebagai ${roleLabel} telah berhasil dibuat.

INFORMASI LOGIN
---------------
Email: ${data.email}
Password Sementara: ${data.temp_password}

PENTING: Anda akan diminta untuk mengganti password saat login pertama kali.

Login sekarang di: ${data.app_url}/login

---
RINDANG - Sistem Informasi Manajemen Pertanian Digital`;
}
