import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useSession } from "@/contexts/SessionContext";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import espressoImg from '@/assets/images/menu/espresso.jpg';
import latteImg from '@/assets/images/menu/latte.jpg';
import chocolateCakeImg from '@/assets/images/menu/chocolate-cake.jpg';
import greenTeaImg from '@/assets/images/menu/green-tea.jpg';
import sandwichImg from '@/assets/images/menu/sandwich.jpg';

interface MenuCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem, quantity: number) => void;
  isInCart: boolean;
  cartQuantity?: number;
}

export default function MenuCard({ 
  item, 
  onAddToOrder, 
  isInCart, 
  cartQuantity = 0 
}: MenuCardProps) {
  const { activeSession } = useSession();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(cartQuantity || 1);

  // Xử lý hình ảnh
  const getImageUrl = () => {
    // Tạo map cho hình ảnh local
    const localImages: Record<string, string> = {
      'espresso.jpg': espressoImg,
      'latte.jpg': latteImg,
      'chocolate-cake.jpg': chocolateCakeImg,
      'green-tea.jpg': greenTeaImg,
      'sandwich.jpg': sandwichImg,
    };
    
    // Nếu URL bắt đầu với http hoặc https thì sử dụng trực tiếp
    if (item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'))) {
      return item.imageUrl;
    }
    
    // Trích xuất tên file từ đường dẫn
    let filename = item.imageUrl;
    if (item.imageUrl && item.imageUrl.includes('/')) {
      filename = item.imageUrl.split('/').pop() || '';
    }
    
    // Kiểm tra xem tên file có trong map local không
    if (filename && localImages[filename]) {
      return localImages[filename];
    }
    
    // Nếu không tìm thấy, dùng Unsplash
    const unsplashImages: Record<string, string> = {
      "Coffee": "https://www.google.com/url?sa=i&url=https%3A%2F%2Fthecoffeehouse.com%2Fblogs%2Fcoffeeholic%2Fespresso-la-gi-cach-phan-biet-cac-loai-espresso&psig=AOvVaw0_OcoAFBQwlUwBYj9DQ_lL&ust=1743700547908000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCKibiPDsuYwDFQAAAAAdAAAAABAE",
      "Tea": "https://images.unsplash.com/photo-1547825407-2d060104b7f8",
      "Dessert": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
      "Food": "https://images.unsplash.com/photo-1565299507177-b0ac66763828",
      "Drinks": "https://images.unsplash.com/photo-1544787219-7f47ccb76574"
    };
    
    // Dùng hình ảnh danh mục nếu có
    if (item.category && unsplashImages[item.category]) {
      return unsplashImages[item.category];
    }
    
    // Sử dụng ảnh placeholder nếu không có URL hoặc URL không hợp lệ
    return `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.name)}`;
  };

  const handleAddToOrder = () => {
    try {
      // Check if there's no active session first
      if (!activeSession) {
        console.log("🚀 ~ handleAddToOrder ~ activeSession:", activeSession)
        toast({
          title: "No active session",
          description: "You need to check in first before ordering",
          variant: "error",
        });
        return;
      }
      
      // If there is an active session, add to order
      onAddToOrder(item, quantity);
      toast({
        title: "Added to cart",
        description: `Added ${quantity} ${item.name} to your order`,
        variant: "success",
      });
    } catch (error) {
      console.log("🚀 ~ handleAddToOrder ~ error:", error)
    }
  };

  return (
    <Card className="border border-gray-200 rounded-lg p-4 flex">
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-3 flex-shrink-0">
        <img 
          src={getImageUrl()}
          alt={item.name} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            // Fallback nếu ảnh lỗi
            const target = e.target as HTMLImageElement;
            
            // Tìm hình ảnh Unsplash cho danh mục
            const unsplashImages: Record<string, string> = {
              "Coffee": "https://file.hstatic.net/1000075078/article/blog_f80b599183c340bca744c174e7ab2af8_master.jpg",
              "Tea": "https://images.unsplash.com/photo-1547825407-2d060104b7f8",
              "Dessert": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
              "Food": "https://images.unsplash.com/photo-1565299507177-b0ac66763828",
              "Drinks": "https://images.unsplash.com/photo-1544787219-7f47ccb76574"
            };
            
            // Kiểm tra nếu đã thất bại từ getImageUrl và đã dùng placeholder
            if (target.src.includes('via.placeholder.com')) {
              // Không làm gì nếu đã là placeholder
              return;
            }
            
            // Dùng hình ảnh danh mục nếu có
            if (item.category && unsplashImages[item.category]) {
              target.src = unsplashImages[item.category];
            } else {
              // Cuối cùng dùng placeholder
              target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.name)}`;
            }
          }}
        />
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between">
          <h3 className="font-medium">{item.name}</h3>
          <span className="text-[#06C755] font-medium">¥{item.price}</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
        
        {isInCart ? (
          <Button
            className="text-sm bg-[#06C755] text-white px-4 py-1 rounded-full"
          >
            Added ({cartQuantity})
          </Button>
        ) : (
          <Button
            onClick={handleAddToOrder}
            className="text-sm bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755]/20 px-4 py-1 rounded-full"
          >
            + Add to order
          </Button>
        )}
      </div>
    </Card>
  );
}
