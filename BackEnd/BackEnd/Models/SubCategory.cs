using System;
using System.Collections.Generic;

namespace BackEnd.Models;

public partial class SubCategory
{
    public int SubCategoryId { get; set; }

    public string SubCategoryName { get; set; } = null!;

    public string SubCategoryCode { get; set; } = null!;

    public virtual ICollection<CategorySubCategory> CategorySubCategories { get; set; } = new List<CategorySubCategory>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
