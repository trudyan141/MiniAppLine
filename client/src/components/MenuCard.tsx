import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useSession } from "@/contexts/SessionContext";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";


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
  
    if (item.imageUrl === 'https://vi.wikipedia.org/wiki/T%E1%BA%ADp_tin:(A_Donde_Vamos,_Quito)_Chocolate_of_Ecuador_and_Espresso.JPG') {
      return 'https://upload.wikimedia.org/wikipedia/commons/5/51/%28A_Donde_Vamos%2C_Quito%29_Chocolate_of_Ecuador_and_Espresso.JPG'
    }
    // Nếu URL bắt đầu với http hoặc https thì sử dụng trực tiếp
    if (item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'))) {
     
      return item.imageUrl;
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
            
        
            // Cuối cùng dùng placeholder
            target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.name)}`;
            
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
