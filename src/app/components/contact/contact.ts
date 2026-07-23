import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent implements OnInit {
  name = '';
  email = '';
  phone = '';
  serviceOption = 'Lighting Solutions';
  message = '';

  // Anti-Spam Human Verification Controls
  captchaNum1 = 0;
  captchaNum2 = 0;
  userCaptchaInput: number | string = '';
  honeypotTrap = '';
  captchaError = '';

  // Progress & submission state
  isSubmitting = false;
  submissionState: 'idle' | 'sending' | 'success' | 'error' = 'idle';
  progressPercent = 0;
  progressStepText = '';
  errorMessage = '';
  recipientEmail = environment.recipientEmail;

  ngOnInit(): void {
    this.generateCaptcha();
  }

  generateCaptcha(): void {
    this.captchaNum1 = Math.floor(Math.random() * 9) + 1;
    this.captchaNum2 = Math.floor(Math.random() * 9) + 1;
    this.userCaptchaInput = '';
    this.captchaError = '';
  }

  isCaptchaInvalid(): boolean {
    if (this.userCaptchaInput === '' || this.userCaptchaInput === null || this.userCaptchaInput === undefined) {
      return true;
    }
    return Number(this.userCaptchaInput) !== (this.captchaNum1 + this.captchaNum2);
  }

  getWhatsAppUrl(): string {
    const contactPhone = environment.whatsappContact.replace('+', '');
    const textMessage = encodeURIComponent(
      `Hello Civitas, my name is ${this.name}. I would like to consult regarding ${this.serviceOption} services.\nEmail: ${this.email}\nPhone: ${this.phone}\nMessage: ${this.message}`
    );
    return `https://wa.me/${contactPhone}?text=${textMessage}`;
  }

  async onSubmitForm(form: NgForm): Promise<void> {
    // 1. Silent Honeypot Trap Check for Automated Bots
    if (this.honeypotTrap) {
      console.warn('Spambot detected via honeypot trap. Submission blocked.');
      return;
    }

    // 2. Human Verification Math Check
    if (this.isCaptchaInvalid()) {
      this.captchaError = `Incorrect answer. Please solve: ${this.captchaNum1} + ${this.captchaNum2} = ?`;
      return;
    }

    if (!form || form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submissionState = 'sending';
    this.progressPercent = 15;
    this.progressStepText = 'Validating input and initializing secure connection...';
    this.errorMessage = '';
    this.captchaError = '';

    const formattedTime = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const templateParams = {
      name: this.name,
      email: this.email,
      reply_to: this.email,
      phone: this.phone || 'Not provided',
      service_option: this.serviceOption,
      message: this.message,
      time: formattedTime,
      to_email: environment.recipientEmail,
      service_name: environment.emailjs.serviceName
    };

    // Step 2 progress update
    setTimeout(() => {
      if (this.submissionState === 'sending') {
        this.progressPercent = 45;
        this.progressStepText = 'Packaging template payload for Civitas Email Service...';
      }
    }, 400);

    // Step 3 progress update
    setTimeout(() => {
      if (this.submissionState === 'sending') {
        this.progressPercent = 75;
        this.progressStepText = `Dispatching email to ${environment.recipientEmail} via EmailJS...`;
      }
    }, 900);

    try {
      const publicKey = environment.emailjs.publicKey;

      // Check if user has provided their public key
      if (!publicKey || publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        await new Promise((resolve) => setTimeout(resolve, 1400));
        this.progressPercent = 100;
        this.progressStepText = 'Please provide your EmailJS Public Key in .env';
        this.submissionState = 'error';
        this.errorMessage = 'EmailJS Public Key is required. Please set EMAILJS_PUBLIC_KEY in your .env file or environment.ts.';
        this.isSubmitting = false;
        return;
      }

      await emailjs.send(
        environment.emailjs.serviceId,
        environment.emailjs.templateId,
        templateParams,
        publicKey
      );

      this.progressPercent = 100;
      this.progressStepText = 'Message successfully dispatched to Civitas Solutions!';
      this.submissionState = 'success';
      this.isSubmitting = false;

      // Reset form fields and generate new captcha
      setTimeout(() => {
        form.resetForm({
          serviceOption: 'Lighting Solutions'
        });
        this.generateCaptcha();
      }, 800);

    } catch (error: any) {
      console.error('EmailJS Error:', error);
      this.progressPercent = 100;
      this.submissionState = 'error';
      this.isSubmitting = false;
      this.errorMessage = error?.text || error?.message || 'Failed to send email. Please verify your EmailJS credentials or network connection.';
    }
  }

  resetStatus(): void {
    this.submissionState = 'idle';
    this.progressPercent = 0;
    this.progressStepText = '';
    this.errorMessage = '';
    this.generateCaptcha();
  }

  directWhatsAppChat(): void {
    const contactPhone = environment.whatsappContact.replace('+', '');
    window.open(`https://wa.me/${contactPhone}?text=Hello%20Civitas%2C%20I%20would%20like%20to%20consult%20regarding%20your%20services.`, '_blank');
  }
}


