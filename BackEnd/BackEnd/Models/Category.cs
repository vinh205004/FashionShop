using System;
using System.Collections.Generic;

namespace BackEnd.Models;

public partial class Category
{
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string CategoryCode { get; set; } = null!;

    public virtual ICollection<CategorySubCategory> CategorySubCategories { get; set; } = new List<CategorySubCategory>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
