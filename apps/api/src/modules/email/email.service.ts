import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  @OnEvent('reservation.created', { async: true })
  async handleReservationCreatedEvent(payload: any) {
    this.logger.log(`Received 'reservation.created' event for Conf #: ${payload.confirmationCode}`);
    
    // Simulate an artificial delay that a real SMTP transport might take
    this.logger.log(`Starting to send email to guest ${payload.guest.email}...`);
    await this.simulateDelay(3000);
    
    // Simulate successful email sending
    this.logger.log(`✅ SUCCESS: Confirmation email sent to ${payload.guest.firstName} ${payload.guest.lastName} for reservation ${payload.confirmationCode}`);
  }

  @OnEvent('reservation.confirmed', { async: true })
  async handleReservationConfirmedEvent(payload: any) {
    this.logger.log(`Received 'reservation.confirmed' event for Conf #: ${payload.confirmationCode}`);
    
    // Simulate an artificial delay that a real SMTP transport might take
    this.logger.log(`Starting to send confirmation email to guest ${payload.guest?.email}...`);
    await this.simulateDelay(3000);
    
    // Simulate successful email sending
    this.logger.log(`✅ SUCCESS: Confirmation email sent to ${payload.guest?.firstName} ${payload.guest?.lastName} for reservation ${payload.confirmationCode}`);
  }

  @OnEvent('folio.closed', { async: true })
  async handleFolioClosedEvent(payload: any) {
    this.logger.log(`Received 'folio.closed' event for Folio #: ${payload.folioId}`);
    
    // Simulate SMTP delay
    this.logger.log(`Starting to generate PDF receipt and send email...`);
    await this.simulateDelay(4000);
    
    this.logger.log(`✅ SUCCESS: Check-out receipt emailed successfully.`);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

