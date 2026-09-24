'use client';

import { SafeImage } from '@/components/shared/SafeImage';
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  RotateCcw,
  Percent,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import { Product, Order } from '@/types';

interface ProfitAnalyticsReportsProps {
  products: Product[];
  orders: Order[];
  currency: 'USD' | 'BDT';
  onUpdateProductCostPrice?: (productId: string, costPrice: number) => void;
  onDeleteProduct?: (productId: string) => void;
}

type DatePeriod = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all' | 'custom';

export const ProfitAnalyticsReports: React.FC<ProfitAnalyticsReportsProps> = ({
  products,
  orders,
  currency,
  onUpdateProductCostPrice,
  onDeleteProduct,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'delivered_only' | 'all_confirmed' | 'all'>('delivered_only');
  const [productSearch, setProductSearch] = useState<string>('');
  const [editingCostProductId, setEditingCostProductId] = useState<string | null>(null);
  const [tempCostInput, setTempCostInput] = useState<string>('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const symbol = currency === 'BDT' ? '৳' : '$';

  // Date Filtering Logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of week (Sunday or Monday, let's take past 7 days / current week start)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Start of year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return orders.filter((order) => {
      // 1. Status Filter
      const status = (order.orderStatus || order.status || '').toLowerCase();
      if (statusFilter === 'delivered_only') {
        if (status !== 'delivered') return false;
      } else if (statusFilter === 'all_confirmed') {
        if (status === 'cancelled') return false;
      }

      // 2. Date Filter
      if (selectedPeriod === 'all') return true;

      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return true;

      if (selectedPeriod === 'today') {
        return orderDate >= startOfToday;
      } else if (selectedPeriod === 'this_week') {
        return orderDate >= startOfWeek;
      } else if (selectedPeriod === 'this_month') {
        return orderDate >= startOfMonth;
      } else if (selectedPeriod === 'this_year') {
        return orderDate >= startOfYear;
      } else if (selectedPeriod === 'custom') {
        if (customStartDate && new Date(customStartDate) > orderDate) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
        return true;
      }

      return true;
    });
  }, [orders, selectedPeriod, customStartDate, customEndDate, statusFilter]);

  // Product-wise Performance Calculation
  const productPerformance = useMemo(() => {
    // Map productId -> Metrics
    const map = new Map<string, {
      product: Product;
      totalUnitsSold: number;
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      orderCount: number;
    }>();

    // Initialize all existing products
    products.forEach((p) => {
      map.set(p.id, {
        product: p,
        totalUnitsSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        orderCount: 0,
      });
    });

    // Aggregate from filtered orders
    filteredOrders.forEach((order) => {
      const items = order.items || [];
      items.forEach((item: any) => {
        // Find product
        const prodId = item.productId || item.id || (item.product && item.product.id);
        const qty = Number(item.quantity || 1);
        const unitPrice = Number(
          item.unitPriceSnapshot || item.price || (item.product && item.product.price) || 0
        );
        const revenue = unitPrice * qty;

        if (prodId && map.has(prodId)) {
          const entry = map.get(prodId)!;
          const costPerUnit = Number(entry.product.costPrice || 0);
          const totalItemCost = costPerUnit * qty;
          const profit = revenue - totalItemCost;

          entry.totalUnitsSold += qty;
          entry.totalRevenue += revenue;
          entry.totalCost += totalItemCost;
          entry.totalProfit += profit;
          entry.orderCount += 1;
        } else {
          // If product not in map (e.g. deleted or snapshot only), create transient entry
          const fallbackProduct: Product = {
            id: prodId || `snapshot-${item.productNameSnapshot || 'item'}`,
            name: item.productNameSnapshot || (item.product && item.product.name) || 'Unknown Product',
            price: unitPrice,
            costPrice: 0,
            category: 'Store Item',
            inStock: true,
            image: item.productImageSnapshot || (item.product && item.product.image) || '',
            images: [],
            rating: 5,
            reviewCount: 0,
            description: '',
          };

          map.set(fallbackProduct.id, {
            product: fallbackProduct,
            totalUnitsSold: qty,
            totalRevenue: revenue,
            totalCost: 0,
            totalProfit: revenue,
            orderCount: 1,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [products, filteredOrders]);

  // Overall Financial Summary
  const financialSummary = useMemo(() => {
    let grossRevenue = 0;
    let totalDeliveryFeeCollected = 0;
    let totalCostOfGoodsSold = 0;
    let totalDeliveredOrders = 0;
    let totalCancelledOrders = 0;
    let totalUnitsSold = 0;

    filteredOrders.forEach((o) => {
      const orderTotal = Number(o.total || o.totalAmount || 0);
      const deliveryFee = Number(o.shipping || o.deliveryFee || 0);
      const status = (o.orderStatus || o.status || '').toLowerCase();

      if (status === 'delivered') {
        totalDeliveredOrders += 1;
      } else if (status === 'cancelled') {
        totalCancelledOrders += 1;
      }

      grossRevenue += orderTotal;
      totalDeliveryFeeCollected += deliveryFee;

      const items = o.items || [];
      items.forEach((item: any) => {
        const prodId = item.productId || item.id || (item.product && item.product.id);
        const qty = Number(item.quantity || 1);
        totalUnitsSold += qty;

        const prod = products.find((p) => p.id === prodId);
        const unitCost = Number(prod?.costPrice || 0);
        totalCostOfGoodsSold += unitCost * qty;
      });
    });

    const netProductRevenue = Math.max(0, grossRevenue - totalDeliveryFeeCollected);
    const netGrossProfit = Math.max(0, netProductRevenue - totalCostOfGoodsSold);
    const profitMarginPercentage = netProductRevenue > 0 ? (netGrossProfit / netProductRevenue) * 100 : 0;

    return {
      grossRevenue,
      netProductRevenue,
      totalDeliveryFeeCollected,
      totalCostOfGoodsSold,
      netGrossProfit,
      profitMarginPercentage,
      totalOrdersCount: filteredOrders.length,
      totalDeliveredOrders,
      totalCancelledOrders,
      totalUnitsSold,
    };
  }, [filteredOrders, products]);

  // CSV Export for Excel/Google Sheets
  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'Category',
      'Selling Price (BDT)',
      'Cost Price (BDT)',
      'Units Sold',
      'Total Revenue (BDT)',
      'Total Cost (BDT)',
      'Net Profit (BDT)',
      'Profit Margin (%)'
    ];

    const rows = productPerformance.map((item) => {
      const margin = item.totalRevenue > 0 ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(1) : '0';
      return [
        `"${item.product.name.replace(/"/g, '""')}"`,
        `"${item.product.category}"`,
        item.product.price,
        item.product.costPrice || 0,
        item.totalUnitsSold,
        item.totalRevenue,
        item.totalCost,
        item.totalProfit,
        `${margin}%`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `albarakah_sales_profit_report_${selectedPeriod}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSaveCostPrice = (productId: string) => {
    const cost = parseFloat(tempCostInput);
    if (!isNaN(cost) && cost >= 0 && onUpdateProductCostPrice) {
      onUpdateProductCostPrice(productId, cost);
    }
    setEditingCostProductId(null);
    setTempCostInput('');
  };

  const filteredProductPerformance = productPerformance.filter((item) => {
    if (!productSearch.trim()) return true;
    const query = productSearch.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(query) ||
      item.product.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 sm:p-7 lg:p-8 space-y-6 w-full">
      {/* 1. Header & Filter Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0a5c36] flex items-center justify-center border border-emerald-200 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-stone-900 font-serif">
                প্রোডাক্ট বিক্রয় ও লাভ-ক্ষতি হিসাব (Profit & Loss Analytics)
              </h2>
              <p className="text-xs text-stone-500 font-bengali">
                কোন পণ্যে কত টাকা বিক্রি ও নিট লাভ হয়েছে দিন, সপ্তাহ, মাস ও বছর অনুযায়ী সহজে দেখুন
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="delivered_only">✅ শুধুমাত্র ডেলিভার্ড অর্ডার (Realized)</option>
            <option value="all_confirmed">📦 সকল কনফার্মড অর্ডার (Processing & Shipped)</option>
            <option value="all">📋 সকল অর্ডার (All Orders)</option>
          </select>

          {/* Export to Excel / CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Excel / CSV ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সেল শিট ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* 2. Period Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200 w-fit">
        {[
          { id: 'today', label: '📅 আজকের হিসাব (Today)' },
          { id: 'this_week', label: '📊 চলতি সপ্তাহ (This Week)' },
          { id: 'this_month', label: '📈 চলতি মাস (This Month)' },
          { id: 'this_year', label: '🏆 চলতি বছর (This Year)' },
          { id: 'all', label: '🌐 শুরু থেকে সব (All Time)' },
          { id: 'custom', label: '⚙️ কাস্টম তারিখ (Custom)' },
        ].map((period) => (
          <button
            key={period.id}
            type="button"
            onClick={() => setSelectedPeriod(period.id as DatePeriod)}
            className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-bengali ${
              selectedPeriod === period.id
                ? 'bg-white text-[#0a5c36] shadow-xs border border-stone-200/80 scale-[1.02]'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {selectedPeriod === 'custom' && (
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700 font-bengali">শুরুর তারিখ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-semibold text-stone-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700 font-bengali">শেষের তারিখ:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-semibold text-stone-800"
            />
          </div>
        </div>
      )}

      {/* 3. High Level Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-bengali">
                মোট পণ্য বিক্রয় (Product Sales)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-mono">
                {symbol}{Math.round(financialSummary.netProductRevenue).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 flex items-center gap-1 font-bengali">
            <span>মোট অর্ডার: <strong>{financialSummary.totalOrdersCount} টি</strong></span>
            <span className="text-stone-300">•</span>
            <span>মোট বিক্রি: <strong>{financialSummary.totalUnitsSold} পিস</strong></span>
          </div>
        </div>

        {/* Card 2: Total Cost of Goods */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-bengali">
                মোট কেনা খরচ (Total Cost)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-stone-800 mt-2 font-mono">
                {symbol}{Math.round(financialSummary.totalCostOfGoodsSold).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 font-bengali">
            প্রোডাক্টের ক্রয়মূল্য বা উৎপাদন খরচ
          </div>
        </div>

        {/* Card 3: Net Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider font-bengali flex items-center gap-1">
                <span>মোট লাভ (Estimated Net Profit)</span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#0a5c36] mt-2 font-mono">
                {symbol}{Math.round(financialSummary.netGrossProfit).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300 shrink-0">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-3 font-bengali flex items-center gap-1">
            <span>লাভের হার (Margin):</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
              {financialSummary.profitMarginPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 4: Delivery Charge Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-bengali">
                ডেলিভারি কালেকশন ও স্ট্যাটাস
              </span>
              <div className="text-2xl sm:text-3xl font-black text-stone-800 mt-2 font-mono">
                {symbol}{Math.round(financialSummary.totalDeliveryFeeCollected).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 font-bengali flex items-center gap-1.5">
            <span className="text-emerald-700 font-semibold">ডেলিভার্ড: {financialSummary.totalDeliveredOrders}</span>
            <span className="text-stone-300">|</span>
            <span className="text-rose-600 font-semibold">বাতিল: {financialSummary.totalCancelledOrders}</span>
          </div>
        </div>
      </div>

      {/* 4. Product Wise Breakdown Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
              পণ্যভিত্তিক সেলস, খরচ ও নিট লাভ (Product Performance Breakdown)
            </h3>
            <p className="text-xs text-stone-500 font-bengali">
              কোন প্রোডাক্ট কত পিস বিক্রি হয়েছে এবং কত লাভ হচ্ছে তার সম্পূর্ণ বিবরণ
            </p>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="প্রোডাক্ট খুঁজুন..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="px-4 py-3.5">প্রোডাক্টের নাম</th>
                <th className="px-4 py-3.5">ক্যাটাগরি</th>
                <th className="px-4 py-3.5">বিক্রয় মূল্য</th>
                <th className="px-4 py-3.5">কেনা দাম (Cost Price)</th>
                <th className="px-4 py-3.5 text-center">বিক্রি (পিস)</th>
                <th className="px-4 py-3.5">মোট বিক্রয় (Revenue)</th>
                <th className="px-4 py-3.5">মোট খরচ (Cost)</th>
                <th className="px-4 py-3.5">নিট লাভ (Net Profit)</th>
                <th className="px-4 py-3.5 text-right">লাভের মার্জিন (%)</th>
                <th className="px-4 py-3.5 text-center">একশন (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredProductPerformance.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-stone-400 font-bengali">
                    কোনো প্রোডাক্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredProductPerformance.map((item) => {
                  const hasCost = Number(item.product.costPrice || 0) > 0;
                  const profitMargin =
                    item.totalRevenue > 0
                      ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(1)
                      : '0';

                  const isEditingCost = editingCostProductId === item.product.id;

                  return (
                    <tr
                      key={item.product.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        item.totalUnitsSold > 0 ? 'bg-white' : 'bg-stone-50/30 opacity-70'
                      }`}
                    >
                      {/* Product Name & Image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 max-w-[240px]">
                          <SafeImage
                            src={item.product.image || (item.product.images && item.product.images[0])}
                            alt={item.product.name}
                            className="w-10 h-10 rounded-lg object-contain bg-stone-100 border border-stone-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 line-clamp-1" title={item.product.name}>
                              {item.product.name}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              ID: #{item.product.id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-stone-600">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                          {item.product.category}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3 font-bold text-stone-900 font-mono">
                        {symbol}{item.product.price}
                      </td>

                      {/* Cost Price with Quick Inline Edit */}
                      <td className="px-4 py-3">
                        {isEditingCost ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              placeholder="কেনা দাম"
                              value={tempCostInput}
                              onChange={(e) => setTempCostInput(e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg border border-emerald-500 bg-white text-xs font-mono font-bold focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCostPrice(item.product.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                            >
                              সেভ
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCostProductId(null)}
                              className="px-1.5 py-1 rounded-lg bg-stone-200 text-stone-700 text-[10px] font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold ${hasCost ? 'text-stone-800' : 'text-amber-600'}`}>
                              {hasCost ? `${symbol}${item.product.costPrice}` : 'নির্ধারণ নেই'}
                            </span>
                            {onUpdateProductCostPrice && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCostProductId(item.product.id);
                                  setTempCostInput(String(item.product.costPrice || ''));
                                }}
                                className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-bengali"
                                title="কেনা দাম এডিট করুন"
                              >
                                [এডিট]
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Units Sold */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                          item.totalUnitsSold > 0
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-stone-100 text-stone-400'
                        }`}>
                          {item.totalUnitsSold}
                        </span>
                      </td>

                      {/* Total Revenue */}
                      <td className="px-4 py-3 font-bold text-stone-900 font-mono">
                        {symbol}{Math.round(item.totalRevenue).toLocaleString()}
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-3 font-semibold text-stone-600 font-mono">
                        {symbol}{Math.round(item.totalCost).toLocaleString()}
                      </td>

                      {/* Net Profit */}
                      <td className="px-4 py-3">
                        <span className={`font-bold font-mono ${
                          item.totalProfit > 0
                            ? 'text-emerald-700'
                            : item.totalProfit < 0
                            ? 'text-rose-600'
                            : 'text-stone-400'
                        }`}>
                          {item.totalProfit > 0 ? '+' : ''}{symbol}{Math.round(item.totalProfit).toLocaleString()}
                        </span>
                      </td>

                      {/* Margin % */}
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          Number(profitMargin) > 30
                            ? 'bg-emerald-100 text-emerald-900'
                            : Number(profitMargin) > 0
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}>
                          {profitMargin}%
                        </span>
                      </td>

                      {/* Delete / Action Button */}
                      <td className="px-4 py-3 text-center">
                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => setProductToDelete(item.product)}
                            className="p-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs active:scale-95"
                            title="এই প্রোডাক্টটি মুছে ফেলুন (Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span className="font-bengali">ডিলিট</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                প্রোডাক্ট মুছে ফেলার নিশ্চিতকরণ
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-bengali">
                আপনি কি নিশ্চিতভাবে <strong className="text-stone-900">"{productToDelete.name}"</strong> প্রোডাক্টটি ওয়েবসাইট ও ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলতে চান?
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
              <SafeImage
                src={productToDelete.image || (productToDelete.images && productToDelete.images[0])}
                alt={productToDelete.name}
                className="w-12 h-12 rounded-xl object-contain bg-white border border-stone-200"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-stone-900 truncate">{productToDelete.name}</div>
                <div className="text-[11px] text-stone-500 font-mono">মূল্য: {symbol}{productToDelete.price} • {productToDelete.category}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer font-bengali"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProduct && productToDelete) {
                    onDeleteProduct(productToDelete.id);
                  }
                  setProductToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer font-bengali flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, মুছে ফেলুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
