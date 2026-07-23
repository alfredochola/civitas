import { Component } from '@angular/core';
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
export class ContactComponent {
  name = '';
  email = '';
  phone = '';
  serviceOption = 'Lighting Solutions';
  message = '';

  // Progress & submission state
  isSubmitting = false;
  submissionState: 'idle' | 'sending' | 'success' | 'error' = 'idle';
  progressPercent = 0;
  progressStepText = '';
  errorMessage = '';
  recipientEmail = environment.recipientEmail;

  getWhatsAppUrl(): string {
    const contactPhone = environment.whatsappContact.replace('+', '');
    const textMessage = encodeURIComponent(
      `Hello Civitas, my name is ${this.name}. I would like to consult regarding ${this.serviceOption} services.\nEmail: ${this.email}\nPhone: ${this.phone}\nMessage: ${this.message}`
    );
    return `https://wa.me/${contactPhone}?text=${textMessage}`;
  }

  async onSubmitForm(form: NgForm): Promise<void> {
    if (!form || form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submissionState = 'sending';
    this.progressPercent = 15;
    this.progressStepText = 'Validating input and initializing secure connection...';
    this.errorMessage = '';

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

      // Reset form fields
      setTimeout(() => {
        form.resetForm({
          serviceOption: 'Lighting Solutions'
        });
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
  }

  directWhatsAppChat(): void {
    const contactPhone = environment.whatsappContact.replace('+', '');
    window.open(`https://wa.me/${contactPhone}?text=Hello%20Civitas%2C%20I%20would%20like%20to%20consult%20regarding%20your%20services.`, '_blank');
  }
}

