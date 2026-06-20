import React, { useState, useEffect } from 'react';
import { SkiProduct, ProductCategory, ProductClick } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Tag,
  Star,
  TrendingDown,
  Sparkles,
  Copy,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from "@/components/ui/use-toast";

export default function SkiDeals() {
  const { toast: toastHook } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        SkiProduct.list(),
        ProductCategory.list()
      ]);
      
      // Filter out null values and sort by order - with comprehensive validation
      const validCategories = (categoriesData || [])
        .filter(c => c != null && typeof c === 'object' && c.name)
        .sort((a, b) => ((a?.order || 0) - (b?.order || 0)));
      
      // Filter out null and invalid products - with comprehensive validation
      const validProducts = (productsData || [])
        .filter(p => {
          // Check if product exists and is an object
          if (!p || typeof p !== 'object') return false;
          // Check required fields
          if (!p.id || !p.name) return false;
          // Check if price exists and is a valid number
          if (p.price === null || p.price === undefined || typeof p.price !== 'number' || isNaN(p.price)) return false;
          return true;
        });
      
      setCategories(validCategories);
      setProducts(validProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product) => {
    if (!product?.link) return;
    
    try {
      // Track the click
      const existingClicks = await ProductClick.filter({ product_id: product.id });
      
      if (existingClicks.length > 0) {
        // Update existing click count
        const clickRecord = existingClicks[0];
        await ProductClick.update(clickRecord.id, {
          click_count: (clickRecord.click_count || 0) + 1,
          product_name: product.name
        });
      } else {
        // Create new click record
        await ProductClick.create({
          product_id: product.id,
          product_name: product.name,
          click_count: 1
        });
      }
      
      // Redirect to the actual product link
      window.open(product.link, '_blank');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still redirect even if tracking fails
      window.open(product.link, '_blank');
    }
  };

  const handleCopyCoupon = (couponCode) => {
    navigator.clipboard.writeText(couponCode);
    toast.success('קוד הקופון הועתק בהצלחה!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "דילים לציוד סקי",
          text: "הדילים והמבצעים הטובים ביותר לציוד סקי איכותי!",
          url: window.location.href
        });
        toastHook({ title: "הדילים שותפו בהצלחה!", description: "תודה ששיתפת את הדילים שלנו." });
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.warn("Web Share failed, fallback to clipboard:", error?.message);
        navigator.clipboard.writeText(window.location.href);
        toastHook({
          title: "פעולת השיתוף נחסמה",
          description: "הדפדפן מנע את השיתוף. הקישור הועתק ללוח."
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toastHook({ title: "קישור הועתק!", description: "הדפדפן שלך אינו תומך בשיתוף." });
    }
  };

  // Apply comprehensive filtering before rendering
  const filteredProducts = (selectedCategory === 'all' 
    ? products 
    : products.filter(p => p && p.category_id === selectedCategory)
  ).filter(p => {
    // Triple-check all products are valid before rendering
    return p != null && 
           typeof p === 'object' && 
           p.id && 
           p.name && 
           p.price !== null &&
           p.price !== undefined &&
           typeof p.price === 'number' && 
           !isNaN(p.price);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-2 mb-4">
            <Tag className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800 font-medium">דילים והנחות</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">דילים לציוד סקי</h1>
          <p className="text-xl text-slate-600 mb-2">
            הדילים והמבצעים הטובים ביותר לציוד סקי איכותי
          </p>
          <Link to={createPageUrl("VipForm")}>
            <Button variant="outline" size="sm" className="mt-2">
              רוצה המלצות מותאמות? VIP
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare} className="mt-4 flex items-center gap-2 mx-auto">
            <Share2 className="w-4 h-4" />
            <span>שתף דילים</span>
          </Button>
        </div>

        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="
            bg-white shadow-md rounded-lg p-1 h-auto w-full 
            inline-flex justify-start flex-row-reverse space-x-reverse space-x-1 border border-gray-200 overflow-x-auto
          ">
            <TabsTrigger 
              value="all" 
              className="
                text-base font-semibold text-slate-700 px-4 py-2 rounded-md transition-all duration-200 
                text-right whitespace-nowrap
                hover:bg-orange-100 hover:text-orange-700 
                data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg
              "
            >
              הכל
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id} 
                className="
                  text-base font-semibold text-slate-700 px-4 py-2 rounded-md transition-all duration-200 
                  text-right whitespace-nowrap
                  hover:bg-orange-100 hover:text-orange-700 
                  data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg
                "
              >
                {cat?.name || 'ללא שם'}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts.map(product => {
            // Final safety check before rendering each product
            if (!product || typeof product.price !== 'number' || isNaN(product.price)) {
              return null;
            }
            
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
              >
                <div className="relative bg-slate-50 h-40 sm:h-44 md:h-48 flex items-center justify-center p-2">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {product.is_cheapest && (
                      <Badge className="bg-green-500 text-[10px] sm:text-xs px-1.5 py-0.5">
                        <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />
                        הכי זול
                      </Badge>
                    )}
                    {product.is_best_seller && (
                      <Badge className="bg-blue-500 text-[10px] sm:text-xs px-1.5 py-0.5">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />
                        רב מכר
                      </Badge>
                    )}
                    {product.editors_pick && (
                      <Badge className="bg-purple-500 text-[10px] sm:text-xs px-1.5 py-0.5">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />
                        בחירה
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="text-sm sm:text-base font-medium text-slate-800 line-clamp-2 mb-2 min-h-[2.5rem] sm:min-h-[3rem]">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{product.description}</p>
                  )}
                  
                  <div className="mt-auto">
                    <div className="text-lg sm:text-xl font-bold text-blue-600 mb-2">
                      ${Number(product.price).toFixed(2)}
                    </div>

                    {product.coupon_code && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-600">קוד:</p>
                          <p className="font-bold text-orange-600 text-xs truncate">{product.coupon_code}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCoupon(product.coupon_code);
                          }}
                          className="h-7 w-7 p-0 flex-shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Tag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">אין דילים בקטגוריה זו</h3>
            <p className="text-slate-500">נסה לבחור קטגוריה אחרת</p>
          </div>
        )}
      </div>
    </div>
  );
}