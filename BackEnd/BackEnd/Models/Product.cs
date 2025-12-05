using System;
using System.Collections.Generic;

namespace BackEnd.Models;

public partial class Product
{
    public int ProductId { get; set; }

    public string Title { get; set; } = null!;

    public decimal Price { get; set; }

    public string? Description { get; set; }

    public int? CategoryId { get; set; }

    public int? SubCategoryId { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual ICollection<ProductBadge> ProductBadges { get; set; } = new List<ProductBadge>();

    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public virtual ICollection<ProductSize> ProductSizes { get; set; } = new List<ProductSize>();

    public virtual SubCategory? SubCategory { get; set; }
}
