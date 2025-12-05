using System;
using System.Collections.Generic;

namespace BackEnd.Models;

public partial class ProductBadge
{
    public int Id { get; set; }

    public int? ProductId { get; set; }

    public string? BadgeName { get; set; }

    public virtual Product? Product { get; set; }
}
