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

  const handleAddToOrder = () => {
    if (!activeSession) {
      toast({
        title: "No active session",
        description: "You need to check in first before ordering",
        variant: "destructive",
      });
      return;
    }
    
    onAddToOrder(item, quantity);
  };

  return (
    <Card className="border border-gray-200 rounded-lg p-4 flex">
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-3 flex-shrink-0">
        {item.imageUrl && (
          <img 
            src={`${item.imageUrl}?w=300&q=80`}
            alt={item.name} 
            className="w-full h-full object-cover" 
          />
        )}
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
