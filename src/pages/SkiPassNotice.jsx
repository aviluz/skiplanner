import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { transitionGuestToUser } from "@/lib/guestTripMigration";
import { Ticket, ArrowLeft, CheckCircle2, Info, AlertCircle, AlertTriangle, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TripPlanningProgress from "@/components/TripPlanningProgress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";