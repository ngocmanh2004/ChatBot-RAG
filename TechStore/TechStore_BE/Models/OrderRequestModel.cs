using TechStore_BE.Models;

public class OrderRequestModel
{
    public Orders order { get; set; }

    public List<Order_Details> orderDetails { get; set; }
}
