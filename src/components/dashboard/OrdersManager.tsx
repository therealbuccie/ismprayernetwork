import { useState } from "react";
import { useAllOrders, PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Image } from "lucide-react";
import { toast } from "sonner";

export function OrdersManager() {
  const { data: orders, isLoading } = useAllOrders();
  const { data: books } = useBooks();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);

  const handleApprove = async (order: PurchaseOrder) => {
    try {
      // Update order status
      const { error: orderErr } = await supabase
        .from("purchase_orders")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", order.id);
      if (orderErr) throw orderErr;

      // Grant book access via purchases table
      for (const item of order.items) {
        const book = books?.find(b => b.id === item.book_id);
        const { error } = await supabase.from("purchases").insert({
          user_id: order.user_id,
          book_id: item.book_id,
          format: item.format,
          status: "completed",
          amount: item.price * item.quantity,
          granted_by: user?.id,
        });
        if (error) console.error("Grant error:", error);
      }

      toast.success("Order approved & access granted!");
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      queryClient.invalidateQueries({ queryKey: ["all-purchases"] });
      setViewOrder(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm("Reject this order?")) return;
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success("Order rejected");
    queryClient.invalidateQueries({ queryKey: ["all-orders"] });
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-green-500/20 text-green-400";
    if (s === "rejected") return "bg-destructive/20 text-destructive";
    return "bg-yellow-500/20 text-yellow-400";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Badge variant="outline">
          {orders?.filter(o => o.status === "pending").length || 0} pending
        </Badge>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize text-sm">{order.payment_method.replace("_", " ")}</TableCell>
                  <TableCell className="text-sm">{order.items.length} book(s)</TableCell>
                  <TableCell className="font-medium">${order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewOrder(order)}>
                        <Eye size={15} />
                      </Button>
                      {order.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(order)} className="text-green-500">
                            <CheckCircle size={15} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReject(order.id)} className="text-destructive">
                            <XCircle size={15} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!orders || orders.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order detail modal */}
      <Dialog open={!!viewOrder} onOpenChange={(v) => !v && setViewOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Payment Method</p>
                  <p className="font-medium capitalize">{viewOrder.payment_method.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(viewOrder.status)}`}>
                    {viewOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium">{new Date(viewOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-bold">${viewOrder.total_amount.toFixed(2)}</p>
                </div>
                {viewOrder.espees_code && (
                  <div>
                    <p className="text-muted-foreground text-xs">ESPEES Code</p>
                    <p className="font-medium">{viewOrder.espees_code}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">User ID</p>
                  <p className="font-mono text-xs">{viewOrder.user_id.slice(0, 12)}...</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold mb-2">Items</p>
                <div className="space-y-2">
                  {viewOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm glass-card rounded-md p-2">
                      <span>{item.title} <Badge variant="outline" className="text-[10px] ml-1 capitalize">{item.format}</Badge> × {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* POP image */}
              {viewOrder.pop_image_url && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1"><Image size={14} /> Proof of Payment</p>
                  <a href={viewOrder.pop_image_url} target="_blank" rel="noopener noreferrer">
                    <img src={viewOrder.pop_image_url} alt="POP" className="max-h-60 rounded-lg border border-border object-contain" />
                  </a>
                </div>
              )}

              {/* Actions */}
              {viewOrder.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleApprove(viewOrder)} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle size={16} /> Approve & Grant Access
                  </Button>
                  <Button variant="destructive" onClick={() => { handleReject(viewOrder.id); setViewOrder(null); }} className="flex-1 gap-2">
                    <XCircle size={16} /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
