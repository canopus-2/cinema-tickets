import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    const MAX_TICKETS = 25;
    const ADULT_TICKET_PRICE = 25;
    const CHILD_TICKET_PRICE = 15;
    const INFANT_TICKET_PRICE = 0;

    // If account ID is not an integer or is not greater than 0, throw error
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(
        "accountId must be a positive integer"
      );
    }

    let totalTickets = 0;
    let adultTicketsCount = 0;
    let childTicketsCount = 0;
    let infantTicketsCount = 0;

    // Loop through TicketTypeRequests
    for (const request of ticketTypeRequests) {
      const type = request.getTicketType();
      const noOfTickets = request.getNoOfTickets();

      totalTickets += noOfTickets;

      if (type === "ADULT") {
        adultTicketsCount += noOfTickets;
      }
      if (type === "CHILD") {
        childTicketsCount += noOfTickets;
      }
      if (type === "INFANT") {
        infantTicketsCount += noOfTickets;
      }
    }

    if (totalTickets > MAX_TICKETS) {
      throw new InvalidPurchaseException(
        "Tickets are limited to a maximum of 25"
      );
    }

    // Child and infant cannot be purchased without an adult
    if (
      (childTicketsCount > 0 || infantTicketsCount > 0) &&
      !adultTicketsCount
    ) {
      throw new InvalidPurchaseException(
        "Cannot purchase tickets without at least 1 adult"
      );
    }

    // Infants cannot exceed adults (1 infant to 1 adult)
    if (infantTicketsCount > adultTicketsCount) {
      throw new InvalidPurchaseException(
        "Cannot have more infants than adults"
      );
    }

    // Calculate totals
    let totalCost = 0;
    let totalSeats = 0;
    const adultsTotal = adultTicketsCount * ADULT_TICKET_PRICE;
    const childrenTotal = childTicketsCount * CHILD_TICKET_PRICE;
    const infantTotal = infantTicketsCount * INFANT_TICKET_PRICE;
    totalCost = adultsTotal + childrenTotal + infantTotal;
    totalSeats = adultTicketsCount + childTicketsCount;

    // Make payment
    const payment = new TicketPaymentService();
    payment.makePayment(accountId, totalCost);

    // Reserve seats
    const seats = new SeatReservationService();
    seats.reserveSeat(accountId, totalSeats);
  }
}
