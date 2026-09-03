import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calculator, Plus, Trash2, Package, Bed, Plane, Car, Shield, GraduationCap, Ticket, Wallet, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const CATEGORIES = [
  { value: "equipment", label: "ציוד", icon: Package, color: "text-cyan-600", bg: "bg-cyan-50" },
  { value: "accommodation", label: "לינה", icon: Bed, color: "text-purple-600", bg: "bg-purple-50" },
  { value: "flights", label: "טיסות", icon: Plane, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "transport", label: "תחבורה", icon: Car, color: "text-green-600", bg: "bg-green-50" },
  { value: "insurance", label: "ביטוח", icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  { value: "lessons", label: "שיעורים", icon: GraduationCap, color: "text-orange-600", bg: "bg-orange-50" },