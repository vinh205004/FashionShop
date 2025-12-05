using System;
using System.Collections.Generic;

namespace BackEnd.Models;

public partial class CategorySubCategory
{
    public int Id { get; set; }

    public int CategoryId { get; set; }

    public int SubCategoryId { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual SubCategory SubCategory { get; set; } = null!;
}
