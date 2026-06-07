import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, ShoppingCart, Truck, Scale, Route as RouteIcon,
  Users, Factory, Package, Bus, IdCard, BarChart3, Settings,
  Sparkles, Wallet, BookOpen, Layers,
} from "lucide-react";

interface Props { onCreate: () => void; }

export function CommandPalette({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function go(to: string) {
    setOpen(false);
    navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command — orders, deals, ledger…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => { setOpen(false); onCreate(); }}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />Create One-Shot Order
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/deals")}><Layers className="mr-2 h-4 w-4" />Deals</CommandItem>
          <CommandItem onSelect={() => go("/orders")}><ShoppingCart className="mr-2 h-4 w-4" />Orders</CommandItem>
          <CommandItem onSelect={() => go("/dispatch")}><Truck className="mr-2 h-4 w-4" />Dispatch</CommandItem>
          <CommandItem onSelect={() => go("/weighbridge")}><Scale className="mr-2 h-4 w-4" />Weighbridge</CommandItem>
          <CommandItem onSelect={() => go("/trips")}><RouteIcon className="mr-2 h-4 w-4" />Trips</CommandItem>
          <CommandItem onSelect={() => go("/ledger")}><BookOpen className="mr-2 h-4 w-4" />Ledger 360°</CommandItem>
          <CommandItem onSelect={() => go("/cashbook")}><Wallet className="mr-2 h-4 w-4" />Cashbook</CommandItem>
          <CommandItem onSelect={() => go("/reports")}><BarChart3 className="mr-2 h-4 w-4" />Reports</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Masters">
          <CommandItem onSelect={() => go("/customers")}><Users className="mr-2 h-4 w-4" />Customers</CommandItem>
          <CommandItem onSelect={() => go("/suppliers")}><Factory className="mr-2 h-4 w-4" />Suppliers</CommandItem>
          <CommandItem onSelect={() => go("/products")}><Package className="mr-2 h-4 w-4" />Products</CommandItem>
          <CommandItem onSelect={() => go("/vehicles")}><Bus className="mr-2 h-4 w-4" />Vehicles</CommandItem>
          <CommandItem onSelect={() => go("/drivers")}><IdCard className="mr-2 h-4 w-4" />Drivers</CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
