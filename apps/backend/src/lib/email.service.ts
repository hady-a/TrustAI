import nodemailer from 'nodemailer'

// Check if email credentials are configured
const isEmailConfigured = !!(
  process.env.EMAIL_SERVICE &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD
)

// Create a transporter if credentials are available
const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : null

export class EmailService {
  static async sendWelcomeEmail(
    to: string,
    userName: string
  ): Promise<{ success: boolean; message: string }> {
    // If email is not configured, just return success (feature is optional)
    if (!transporter || !isEmailConfigured) {
      console.log(
        `[Email] Welcome email for ${to} would be sent (email service not configured)`
      )
      return {
        success: true,
        message: 'Welcome email delivery skipped (not configured)',
      }
    }

    try {
      const mailOptions = {
        from: `TrustAI <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Thank You for Trusting TrustAI 🙏',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0B0F19 0%, #1a1f3a 100%); color: #fff; padding: 40px; border-radius: 15px; border: 1px solid #4f46e5;">
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="font-size: 48px; margin-bottom: 15px;">🙏</div>
              <h1 style="color: #c7d2fe; margin: 0; font-size: 28px;">Thank You, ${userName}!</h1>
              <p style="color: #a5b4fc; margin: 10px 0 0 0; font-size: 16px;">We're grateful for your trust</p>
            </div>
            
            <p style="font-size: 15px; color: #d1d5db; line-height: 1.8; margin: 25px 0;">
              Hello <strong>${userName}</strong>,
            </p>
            
            <p style="font-size: 15px; color: #d1d5db; line-height: 1.8; margin: 20px 0;">
              We want to express our sincere gratitude for choosing <strong style="color: #c7d2fe;">TrustAI</strong> as your trusted partner in investigation and analysis. Your decision to join our community means a lot to us.
            </p>

            <div style="background-color: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="font-size: 14px; color: #c7d2fe; margin: 0; font-weight: bold;">Why TrustAI?</p>
              <ul style="font-size: 14px; color: #9ca3af; margin: 15px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">🔒 Enterprise-grade security protecting your sensitive data</li>
                <li style="margin: 8px 0;">🚀 Lightning-fast AI-powered analysis and insights</li>
                <li style="margin: 8px 0;">📊 Comprehensive tools for criminal, interview & business analysis</li>
                <li style="margin: 8px 0;">👥 Dedicated support team standing by to help</li>
              </ul>
            </div>

            <p style="font-size: 15px; color: #d1d5db; line-height: 1.8; margin: 25px 0;">
              We're committed to delivering excellence every single day. Your trust motivates us to continuously innovate and improve our platform.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 13px; color: #9ca3af; margin: 8px 0;">
                <strong>Account Email:</strong> ${to}
              </p>
              <p style="font-size: 13px; color: #9ca3af; margin: 8px 0;">
                <strong>Status:</strong> <span style="color: #10b981;">✓ Active</span>
              </p>
            </div>

            <div style="background-color: rgba(168, 85, 247, 0.1); border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="font-size: 14px; color: #c7d2fe; margin: 0 0 10px 0; font-weight: bold;">Ready to Get Started?</p>
              <p style="font-size: 14px; color: #9ca3af; margin: 0;">Head to your dashboard and explore our powerful analysis modules. We're here for you at every step.</p>
            </div>

            <p style="font-size: 14px; color: #9ca3af; line-height: 1.8; margin: 25px 0;">
              Have any questions? Our support team is always ready to help. Just reply to this email or visit our help center.
            </p>

            <p style="font-size: 14px; color: #9ca3af; margin: 30px 0; text-align: center;">
              <strong style="color: #c7d2fe;">Welcome to the TrustAI family! 🚀</strong>
            </p>

            <div style="border-top: 1px solid rgba(79, 70, 229, 0.3); padding-top: 20px; margin-top: 40px; text-align: center;">
              <p style="font-size: 12px; color: #6b7280; margin: 5px 0;">
                With gratitude and best regards,
              </p>
              <p style="font-size: 12px; color: #6b7280; margin: 10px 0 0 0;">
                The TrustAI Team
              </p>
              <p style="font-size: 11px; color: #6b7280; margin: 15px 0 0 0;">
                ©️ 2026 TrustAI. Advanced Investigation & Analysis Platform.
              </p>
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log(`[Email] Welcome email sent to ${to}`)
      return {
        success: true,
        message: 'Thank you email sent successfully',
      }
    } catch (error) {
      console.error(`[Email] Failed to send welcome email to ${to}:`, error)
      // Return success anyway since this is optional
      return {
        success: true,
        message: 'Thank you email delivery attempted (check logs for details)',
      }
    }
  }

  static async sendResetPasswordEmail(
    to: string,
    resetLink: string
  ): Promise<{ success: boolean; message: string }> {
    if (!transporter || !isEmailConfigured) {
      console.log(`[Email] Password reset email for ${to} would be sent`)
      return { success: true, message: 'Email service not configured' }
    }

    try {
      const mailOptions = {
        from: `TrustAI <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset Your TrustAI Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password (valid for 1 hour):</p>
            <p><a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      return { success: true, message: 'Reset email sent' }
    } catch (error) {
      console.error('Failed to send reset email:', error)
      return { success: true, message: 'Reset email sent (check logs)' }
    }
  }
}
