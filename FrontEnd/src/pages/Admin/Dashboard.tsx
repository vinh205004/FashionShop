import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package, Filter, Calendar } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BASE_URL = "https://localhost:7248/api"; 

const Dashboard = () => {
  // Stats chung
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0 });
  
  // Dữ liệu biểu đồ
  const [chartData, setChartData] = useState([]); 
  
  // State quản lý ngày lọc (Mặc định: 7 ngày trước -> Hôm nay)
  const [dateFilter, setDateFilter] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 ngày trước
    to: new Date().toISOString().split('T')[0] // Hôm nay
  });

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false); // Loading riêng cho biểu đồ

  // 1. Hàm lấy Token
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // 2. Hàm lấy dữ liệu Thống kê chung (Chỉ chạy 1 lần khi load trang)
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/Dashboard/stats`, getAuthHeader());
      setStats(res.data);
    } catch (error) {
      console.error("Lỗi stats:", error);
    }
  };

  // 3. Hàm lấy dữ liệu Biểu đồ (Chạy khi load trang HOẶC khi bấm Lọc)
  const fetchChart = async () => {
    try {
      setChartLoading(true);
      // Gửi kèm from và to lên API
      const res = await axios.get(`${BASE_URL}/Dashboard/chart`, {
        ...getAuthHeader(),
        params: {
          from: dateFilter.from,
          to: dateFilter.to
        }
      });
      setChartData(res.data);
    } catch (error) {
      console.error("Lỗi chart:", error);
    } finally {
      setChartLoading(false);
    }
  };

  // Chạy lần đầu tiên
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchChart()]);
      setLoading(false);
    };
    initData();
  }, []);

  // Xử lý khi người dùng đổi ngày trong ô Input
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter({ ...dateFilter, [e.target.name]: e.target.value });
  };

  // Xử lý khi bấm nút Lọc
  const handleFilterClick = () => {
    fetchChart(); // Gọi lại API biểu đồ với ngày mới
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Đang tải hệ thống...</div>;

  const statCards = [
    { label: 'Tổng doanh thu', value: stats.revenue.toLocaleString('vi-VN') + ' ₫', icon: <DollarSign size={24} />, color: 'bg-green-500' },
    { label: 'Đơn hàng', value: stats.orders, icon: <ShoppingBag size={24} />, color: 'bg-blue-500' },
    { label: 'Khách hàng', value: stats.customers, icon: <Users size={24} />, color: 'bg-purple-500' },
    { label: 'Sản phẩm', value: stats.products, icon: <Package size={24} />, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tổng quan báo cáo</h2>
      
      {/* Cards thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
            <div className={`p-4 rounded-full text-white shadow-lg ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === CỘT TRÁI: BIỂU ĐỒ === */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="font-bold text-lg">Biểu đồ doanh thu</h3>
            
            {/* THANH CÔNG CỤ LỌC NGÀY */}
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
                <div className="flex items-center gap-2 px-2">
                    <Calendar size={16} className="text-gray-500"/>
                    <input 
                        type="date" 
                        name="from"
                        value={dateFilter.from}
                        onChange={handleDateChange}
                        className="bg-transparent text-sm outline-none w-32"
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date" 
                        name="to"
                        value={dateFilter.to}
                        onChange={handleDateChange}
                        className="bg-transparent text-sm outline-none w-32"
                    />
                </div>
                <button 
                    onClick={handleFilterClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
                >
                    <Filter size={14} /> Lọc
                </button>
            </div>
          </div>
          
          <div className="h-80 relative"> 
            {/* Loading Overlay khi đang lọc */}
            {chartLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12}}
                        interval="preserveStartEnd" // Giữ nhãn đầu và cuối
                    />
                    <YAxis 
                        tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(value)} 
                        tick={{fontSize: 12}}
                    />
                    <Tooltip 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        animationDuration={1000}
                    />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 border border-dashed rounded-lg bg-gray-50">
                    <ShoppingBag size={40} className="mb-2 opacity-20"/>
                    <p>Không có doanh thu trong khoảng thời gian này</p>
                </div>
            )}
          </div>
        </div>

        {/* === CỘT PHẢI: HOẠT ĐỘNG === */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Ghi chú hệ thống</h3>
          <div className="space-y-4">
             <div className="flex items-start gap-3 pb-3 border-b">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                    <p className="text-sm font-medium">Hệ thống vận hành tốt</p>
                    <p className="text-xs text-gray-500">API phản hồi dưới 200ms</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div>
                    <p className="text-sm font-medium">Bộ lọc thông minh</p>
                    <p className="text-xs text-gray-500">Đã cập nhật tính năng lọc theo ngày</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;