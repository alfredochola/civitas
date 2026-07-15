import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  serviceOption = 'lighting';
  message = '';
  isSubmitted = false;

  getWhatsAppUrl(): string {
    const contactPhone = environment.whatsappContact.replace('+', '');
    const textMessage = encodeURIComponent(
      `Hello Civitas, my name is ${this.name}. I would like to consult regarding ${this.serviceOption} services.\nEmail: ${this.email}\nPhone: ${this.phone}\nMessage: ${this.message}`
    );
    return `https://wa.me/${contactPhone}?text=${textMessage}`;
  }

  onSubmitForm(form: any): void {
    if (form.valid) {
      this.isSubmitted = true;
      // Simulate form submission
      setTimeout(() => {
        this.isSubmitted = false;
        form.resetForm({
          serviceOption: 'lighting'
        });
        alert('Thank you for contacting Civitas! Your message has been received.');
      }, 1500);
    }
  }

  directWhatsAppChat(): void {
    const contactPhone = environment.whatsappContact.replace('+', '');
    window.open(`https://wa.me/${contactPhone}?text=Hello%20Civitas%2C%20I%20would%20like%20to%20consult%20regarding%20your%20services.`, '_blank');
  }
}
