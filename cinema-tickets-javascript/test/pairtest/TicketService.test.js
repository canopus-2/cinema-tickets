import TicketService from "../../src/pairtest/TicketService.js";
import TicketPaymentService from "../../src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../../src/thirdparty/seatbooking/SeatReservationService.js";
import TicketTypeRequest from "../../src/pairtest/lib/TicketTypeRequest.js";
import InvalidPurchaseException from "../../src/pairtest/lib/InvalidPurchaseException.js";

describe("TicketService", () => {
  let ticketService;

  beforeEach(() => {
    ticketService = new TicketService();
  });

  it("should be an instance of TicketService", () => {
    expect(ticketService).toBeInstanceOf(TicketService);
  });

  it("should have a purchaseTickets method", () => {
    expect(typeof ticketService.purchaseTickets).toBe("function");
  });
});

describe("Purchase tickets", () => {
  let ticketService;

  beforeEach(() => {
    ticketService = new TicketService();
  });

  it("should throw an error if accountId is <= 0", () => {
    const adultTicket = new TicketTypeRequest("ADULT", 1);
    expect(() => ticketService.purchaseTickets(0, adultTicket)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(-1, adultTicket)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(1, adultTicket)).not.toThrow(
      InvalidPurchaseException
    );
  });

  it("should only allow a maximum of 25 tickets to be purchased", () => {
    let adultTicket, childTicket, infantTicket;

    // Scenario 1: Adults only exceeding 25
    adultTicket = new TicketTypeRequest("ADULT", 26);
    expect(() => ticketService.purchaseTickets(1, adultTicket)).toThrow(
      InvalidPurchaseException
    );

    // Scenario 2: Adults and children exceeding 25
    adultTicket = new TicketTypeRequest("ADULT", 24);
    childTicket = new TicketTypeRequest("CHILD", 2);
    expect(() =>
      ticketService.purchaseTickets(1, adultTicket, childTicket)
    ).toThrow(InvalidPurchaseException);

    // Scenario 3: Adults, child and infant exceeding 25
    adultTicket = new TicketTypeRequest("ADULT", 24);
    childTicket = new TicketTypeRequest("CHILD", 1);
    infantTicket = new TicketTypeRequest("INFANT", 1);
    expect(() =>
      ticketService.purchaseTickets(1, adultTicket, childTicket, infantTicket)
    ).toThrow(InvalidPurchaseException);

    // Scenario 4: Mix of tickets equalling 25
    adultTicket = new TicketTypeRequest("ADULT", 20);
    childTicket = new TicketTypeRequest("CHILD", 3);
    infantTicket = new TicketTypeRequest("INFANT", 2);
    expect(() =>
      ticketService.purchaseTickets(1, adultTicket, childTicket, infantTicket)
    ).not.toThrow(InvalidPurchaseException);

    // Scenario 5: Mix of tickets less than 25
    adultTicket = new TicketTypeRequest("ADULT", 15);
    childTicket = new TicketTypeRequest("CHILD", 5);
    infantTicket = new TicketTypeRequest("INFANT", 1);
    expect(() =>
      ticketService.purchaseTickets(1, adultTicket, childTicket, infantTicket)
    ).not.toThrow(InvalidPurchaseException);
  });

  it("child/infant tickets cannot be purchased without adult", () => {
    let adults, children, infants;

    // Scenario 1: No adult and at least 1 child
    adults = new TicketTypeRequest("ADULT", 0);
    children = new TicketTypeRequest("CHILD", 1);
    expect(() => ticketService.purchaseTickets(1, adults, children)).toThrow(
      InvalidPurchaseException
    );

    // Scenario 2: No adult and at least 1 infant
    adults = new TicketTypeRequest("ADULT", 0);
    infants = new TicketTypeRequest("INFANT", 1);
    expect(() => ticketService.purchaseTickets(1, adults, infants)).toThrow(
      InvalidPurchaseException
    );

    // Scenario 3: No adult and at least 1 infant and 1 child
    adults = new TicketTypeRequest("ADULT", 0);
    children = new TicketTypeRequest("CHILD", 3);
    infants = new TicketTypeRequest("INFANT", 1);
    expect(() =>
      ticketService.purchaseTickets(1, adults, children, infants)
    ).toThrow(InvalidPurchaseException);

    // Scenario 4: At least 1 adult and no children/infants
    adults = new TicketTypeRequest("ADULT", 1);
    children = new TicketTypeRequest("CHILD", 0);
    infants = new TicketTypeRequest("INFANT", 0);
    expect(() =>
      ticketService.purchaseTickets(1, adults, children, infants)
    ).not.toThrow(InvalidPurchaseException);
  });

  it("number of infants must not exceed number of adults", () => {
    let adults, infants;
    adults = new TicketTypeRequest("ADULT", 1);
    infants = new TicketTypeRequest("INFANT", 1);
    expect(() =>
      ticketService.purchaseTickets(1, adultTickets, infantTickets)
    ).not.toThrow(InvalidPurchaseException);

    adults = new TicketTypeRequest("ADULT", 1);
    infants = new TicketTypeRequest("INFANT", 2);
    expect(() => ticketService.purchaseTickets(1, adults, infants)).toThrow(
      InvalidPurchaseException
    );
  });

  it("should calculate the correct total cost and make payment", () => {
    const adultTickets = new TicketTypeRequest("ADULT", 2);
    const childTickets = new TicketTypeRequest("CHILD", 3);
    const infantTickets = new TicketTypeRequest("INFANT", 1);

    const paymentSpy = jest.spyOn(
      TicketPaymentService.prototype,
      "makePayment"
    );

    ticketService.purchaseTickets(1, adultTickets, childTickets, infantTickets);

    // (2*25) + (3*15) + (1*0) = 95
    expect(paymentSpy).toHaveBeenCalledWith(1, 95);
    paymentSpy.mockRestore();
  });

  it("should reserve the correct number of seats", () => {
    const adultTickets = new TicketTypeRequest("ADULT", 2);
    const childTickets = new TicketTypeRequest("CHILD", 3);
    const infantTickets = new TicketTypeRequest("INFANT", 1);

    const reserveSpy = jest.spyOn(
      SeatReservationService.prototype,
      "reserveSeat"
    );

    ticketService.purchaseTickets(1, adultTickets, childTickets, infantTickets);

    expect(reserveSpy).toHaveBeenCalledWith(1, 5);
    reserveSpy.mockRestore();
  });
});
