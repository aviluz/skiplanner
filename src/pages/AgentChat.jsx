import React, { useState, useEffect, useRef } from "react";
import { agentSDK } from "@/agents";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Plus, Trash2, Bot, ArrowRight, Menu, X } from "lucide-react";
import MessageBubble from "@/components/agent/MessageBubble";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const AGENT_NAME = "SkiPlanner";