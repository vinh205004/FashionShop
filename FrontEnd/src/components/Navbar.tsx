import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories } from "../services/categoryService";
import type { Category } from "../services/categoryService";

const Navbar: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <nav className="w-full bg-[#3c474c] text-white relative">
      <ul className="max-w-7xl mx-auto flex items-center h-14 text-sm font-semibold">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="cursor-pointer flex-1 px-4 h-full flex items-center justify-center rounded hover:bg-white hover:text-[#3c474c]"
            onMouseEnter={() => setHovered(cat.slug)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate(`/${cat.slug}`)}
          >
            <span className="block">{cat.name}</span>

            {hovered === cat.slug && (
              <div
                className="absolute left-0 top-full z-20 w-full"
                onMouseEnter={() => setHovered(cat.slug)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="max-w-7xl mx-auto bg-white text-[#3c474c] shadow-lg border-t p-6">
                  <h4 className="font-bold text-lg mb-3">DANH MỤC SẢN PHẨM</h4>
                  <ul className="space-y-2">
                    {cat.subCategories.map((sub) => (
                      <li key={sub.id}>
                        <Link 
                          to={`/${cat.slug}/${sub.slug}`} 
                          className="hover:text-red-500"
                          onClick={(e) => {
                          e.stopPropagation();
                          setHovered(null);
                        }}> 
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
