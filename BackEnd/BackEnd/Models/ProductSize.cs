using System;
using System.Collections.Generic;

namespace BackEnd.Models;

public partial class ProductSize
{
    public int Id { get; set; }

    public int? ProductId { get; set; }

    public string? SizeName { get; set; }

    public virtual Product? Product { get; set; }
}
