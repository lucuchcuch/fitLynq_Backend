export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>Welcome to fitLynq!</title>
  <style type="text/css">
    body { margin:0; padding:0; font-family: Arial, sans-serif; line-height:1.6; color:#333333; }
    .ExternalClass { width:100%; }
    .ExternalClass * { line-height:100%; }
    table td { border-collapse: collapse; }
    @media screen and (max-width: 600px) {
      table.responsive-table { width: 100% !important; }
      img.logo { width: 120px !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0;">
  <!-- Main Container with Sports Background + VML Fallback -->
  <!--[if gte mso 9]>
  <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="true">
    <v:fill type="frame" src="https://yourdomain.com/Sports_Background2.svg" color="#f4f4f4"/>
  </v:background>
  <![endif]-->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f4f4" style="background: #f4f4f4 url('https://yourdomain.com/Sports_Background2.svg') no-repeat center center; background-size: cover;">
    <tr>
      <td align="center" valign="top">
        <!-- Email Container -->
        <table class="responsive-table" width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding:20px 20px 10px 20px; text-align:left;">
              <img src="https://yourdomain.com/fitLynq-logo.png" alt="fitLynq" width="150" style="height:auto; display:block;" class="logo"/>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding:20px;">
              <!-- Title -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#7C3AED">
                <tr>
                  <td style="padding:15px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:600;">Welcome to fitLynq!</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Body Content -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 0; color:#333333; font-size:16px;">
                    <p style="margin:0 0 16px 0;">Hello {name},</p>
                    <p style="margin:0 0 16px 0;">We're thrilled to have you join the fitLynq sports community! Get ready to track your progress and connect with fellow athletes.</p>
                    
                    <!-- Sports Trophy Icon -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:30px 0;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" bgcolor="#7C3AED" style="width:80px; height:80px; border-radius:50%; color:#ffffff; font-size:36px; font-weight:bold;">🏆</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:0 0 30px 0;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                            href="{dashboardURL}" style="height:44px; v-text-anchor:middle; width:220px;" arcsize="10%" strokecolor="#7C3AED" fillcolor="#7C3AED">
                            <w:anchorlock/>
                            <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:16px; font-weight:bold;">
                              Go to Dashboard
                            </center>
                          </v:roundrect>
                          <![endif]-->
                          <a href="{dashboardURL}" target="_blank"
                            style="background-color:#7C3AED; color:#ffffff; padding:14px 30px; text-decoration:none;
                            border-radius:30px; font-weight:bold; display:inline-block; font-size:16px; text-transform:uppercase; letter-spacing:1px; mso-hide:all;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin:16px 0 0 0;">If you have any questions, please contact our support team.</p>
                    <p style="margin:16px 0 0 0;">Welcome aboard!<br>The fitLynq Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px; color:#888888; font-size:12px; border-top:1px solid #eeeeee;">
              <p style="margin:0;">© ${new Date().getFullYear()} fitLynq. All rights reserved.</p>
              <p style="margin:8px 0 0 0;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Verify Your Email</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; line-height:1.6; color:#333333;">
  <!-- Main Container -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f4f4" style="background-color:#f4f4f4; margin:0; padding:0;">
    <tr>
      <td align="center" valign="top">
        
        <!-- Email Container -->
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff; width:600px; max-width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="padding:20px 20px 10px 20px; text-align:left;">
              <img src="https://yourdomain.com/fitLynq-logo.png" alt="fitLynq" width="150" style="display:block; height:auto; border:0;"/>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding:20px;">
              
              <!-- Title -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#7C3AED" style="background-color:#7C3AED; border-radius:5px;">
                <tr>
                  <td style="padding:15px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:600; font-family: Arial, sans-serif;">Verify Your Email</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Body -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 0; font-family: Arial, sans-serif; color:#333333; font-size:16px;">
                    
                    <p style="margin:0 0 16px 0;">Hello {name},</p>
                    <p style="margin:0 0 16px 0;">Thank you for signing up to fitLynq! Please verify your email address to complete your registration.</p>
                    
                    <!-- Code Box -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:30px 0;">
                          <div style="background-color:#f8f5ff; padding:20px; border-radius:10px; display:inline-block;">
                            <span style="font-size:32px; font-weight:bold; letter-spacing:5px; color:#7C3AED; font-family: Arial, sans-serif;">{verificationCode}</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin:0 0 16px 0;">Enter this code on the verification page to complete your registration.</p>
                    <p style="margin:0 0 16px 0;">This code will expire in 15 minutes for security reasons.</p>
                    <p style="margin:0 0 16px 0;">If you didn't create an account with us, please ignore this email.</p>
                    <p style="margin:16px 0 0 0;">Best regards,<br>The fitLynq Team</p>
                  
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px; color:#888888; font-size:12px; font-family: Arial, sans-serif; border-top:1px solid #eeeeee;">
              <p style="margin:0;">© ${new Date().getFullYear()} fitLynq. All rights reserved.</p>
              <p style="margin:8px 0 0 0;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>
        
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Password Reset Successful</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; line-height:1.6; color:#333333;">
  <!-- Main Container -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f4f4" style="background-color:#f4f4f4; margin:0; padding:0;">
    <tr>
      <td align="center" valign="top">
        
        <!-- Email Container -->
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff; width:600px; max-width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="padding:20px 20px 10px 20px; text-align:left;">
              <img src="https://yourdomain.com/fitLynq-logo.png" alt="fitLynq" width="150" style="display:block; height:auto; border:0;"/>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding:20px;">
              
              <!-- Title -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#7C3AED" style="background-color:#7C3AED; border-radius:5px;">
                <tr>
                  <td style="padding:15px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:600; font-family: Arial, sans-serif;">Password Reset Successful</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Body -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 0; font-family: Arial, sans-serif; color:#333333; font-size:16px;">
                    
                    <p style="margin:0 0 16px 0;">Hello {name},</p>
                    <p style="margin:0 0 16px 0;">We're writing to confirm that your password has been successfully reset.</p>
                    
                    <!-- Success Icon -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:30px 0;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" bgcolor="#7C3AED" style="width:80px; height:80px; border-radius:50%; color:#ffffff; font-size:30px; font-weight:bold; text-align:center; vertical-align:middle;">✓</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin:0 0 16px 0;">If you did not initiate this password reset, please contact our support team immediately.</p>
                    <p style="margin:0 0 16px 0;">For security reasons, we recommend that you:</p>
                    
                    <ul style="margin:0 0 16px 0; padding-left:20px; font-size:16px; font-family: Arial, sans-serif; color:#333333;">
                      <li style="margin-bottom:8px;">Use a strong, unique password</li>
                      <li style="margin-bottom:8px;">Enable two-factor authentication if available</li>
                      <li style="margin-bottom:8px;">Avoid using the same password across multiple sites</li>
                    </ul>
                    
                    <p style="margin:16px 0 0 0;">Thank you for helping us keep your account secure.</p>
                    <p style="margin:16px 0 0 0;">Best regards,<br>The fitLynq Team</p>
                  
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px; color:#888888; font-size:12px; font-family: Arial, sans-serif; border-top:1px solid #eeeeee;">
              <p style="margin:0;">© ${new Date().getFullYear()} fitLynq. All rights reserved.</p>
              <p style="margin:8px 0 0 0;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>
        
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" 
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" 
      xmlns:v="urn:schemas-microsoft-com:vml" 
      xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
</head>

<body style="margin:0; padding:0; font-family: Arial, sans-serif; line-height:1.6; color:#333333;">

  <!-- Background wrapper with VML fallback for Outlook -->
  <!--[if gte mso 9]>
  <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="true">
    <v:fill type="frame" src="https://yourdomain.com/Sports_Background2.svg" color="#f4f4f4"/>
  </v:background>
  <![endif]-->
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f4f4"
    style="background:#f4f4f4 url('https://yourdomain.com/Sports_Background2.svg') no-repeat center center; background-size:cover;">
    <tr>
      <td align="center" valign="top">

        <!-- Email Container -->
        <table width="600" border="0" cellpadding="0" cellspacing="0" 
          style="background-color:#ffffff; max-width:600px; width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:20px 20px 10px 20px; text-align:left;">
              <img src="https://yourdomain.com/fitLynq-logo.png" alt="fitLynq" width="150" 
                style="height:auto; display:block;"/>
            </td>
          </tr>

          <!-- Header Banner -->
          <tr>
            <td style="padding:20px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#7C3AED" 
                style="border-radius:5px;">
                <tr>
                  <td style="padding:15px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:600;">Password Reset</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:20px; color:#333333; font-size:16px;">
              <p style="margin:0 0 16px 0;">Hello {name},</p>
              <p style="margin:0 0 16px 0;">We received a request to reset your password. 
                If you didn't make this request, please ignore this email.</p>
              <p style="margin:0 0 16px 0;">To reset your password, click the button below:</p>

              <!-- Bulletproof Button -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:30px auto;">
                <tr>
                  <td align="center" bgcolor="#7C3AED" style="border-radius:30px;">
                    <a href="{resetURL}" target="_blank"
                      style="display:inline-block; padding:14px 30px; font-family:Arial, sans-serif;
                      font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none;
                      border-radius:30px; text-transform:uppercase; letter-spacing:1px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px 0;">This link will expire in 1 hour for security reasons.</p>
              <p style="margin:16px 0 0 0;">Best regards,<br>The fitLynq Team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px; color:#888888; font-size:12px; border-top:1px solid #eeeeee;">
              <p style="margin:0;">© ${new Date().getFullYear()} fitLynq. All rights reserved.</p>
              <p style="margin:8px 0 0 0;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;
