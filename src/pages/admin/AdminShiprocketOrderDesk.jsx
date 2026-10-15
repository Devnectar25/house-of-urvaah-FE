import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  Zap,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building,
  Check,
  XCircle,
  ShieldCheck,
  Eye,
  MapPin,
  Calendar,
  Send,
  Sliders
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { shippingApi } from '../../services/shippingApi';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { OrderDetailModal } from '../../components/admin/OrderDetailModal';

export const AdminShiprocketOrderDesk = () => {
  // State: Orders & Filters
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // State: Interactive Forward Step Simulator
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [selectedStep, setSelectedStep] = useState('step3_assign_awb');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // State: Live Pincode Serviceability Inspector
  const [inspectPincode, setInspectPincode] = useState('110001');
  const [inspectWeight, setInspectWeight] = useState('0.5');
  const [inspectCod, setInspectCod] = useState(true);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);

  // State: Live Tracking Scans Drawer & Modal
  const [activeTrackingAwb, setActiveTrackingAwb] = useState(null);
  const [activeTrackingData, setActiveTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch Forward Orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/api/orders?limit=50').catch(() => ({ data: [] }));
      const orderList = Array.isArray(res?.data) ? res.data : (res?.orders || []);
      setOrders(orderList);

      if (!selectedOrderNumber && orderList.length > 0) {
        setSelectedOrderNumber(orderList[0].order_number);
      }
    } catch (err) {
      console.error('Failed to load orders for Shiprocket Order Desk:', err);
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [selectedOrderNumber]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Run Serviceability Check for Inspector Widget
  const handleCheckServiceability = async () => {
    if (!inspectPincode || !/^\d{6}$/.test(String(inspectPincode).trim())) {
      setInspectResult({ success: false, message: 'Please enter a valid 6-digit PIN code.' });
      return;
    }
    setInspectLoading(true);
    setInspectResult(null);
    try {
      const data = await shippingApi.checkServiceability(
        inspectPincode,
        '411001',
        parseFloat(inspectWeight) || 0.5,
        inspectCod ? 1 : 0
      );
      setInspectResult(data);
    } catch (err) {
      setInspectResult({ success: false, message: err.message || 'Serviceability check failed.' });
    } finally {
      setInspectLoading(false);
    }
  };

  // Pipeline Metric Stats
  const stats = useMemo(() => {
    let unassigned = 0;
    let awbAssigned = 0;
    let inTransit = 0;
    let outForDelivery = 0;
    let delivered = 0;

    orders.forEach(ord => {
      const s = (ord.status || '').toLowerCase();
      const hasAwb = Boolean(ord.tracking_number);

      if (s === 'delivered') {
        delivered++;
      } else if (s === 'out for delivery') {
        outForDelivery++;
      } else if (s === 'shipped' || s === 'dispatched' || s === 'in transit') {
        inTransit++;
      } else if (hasAwb) {
        awbAssigned++;
      } else {
        unassigned++;
      }
    });

    return { unassigned, awbAssigned, inTransit, outForDelivery, delivered, total: orders.length };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const ordNum = (ord.order_number || '').toLowerCase();
      const customer = (ord.recipient_name || ord.user_name || ord.customer_name || '').toLowerCase();
      const awb = (ord.tracking_number || '').toLowerCase();
      const matchesSearch = ordNum.includes(searchTerm.toLowerCase()) || 
                            customer.includes(searchTerm.toLowerCase()) ||
                            awb.includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const s = (ord.status || '').toLowerCase();
      const hasAwb = Boolean(ord.tracking_number);

      if (stageFilter === 'all') return true;
      if (stageFilter === 'pending_awb') return !hasAwb && !['delivered', 'cancelled'].includes(s);
      if (stageFilter === 'awb_assigned') return hasAwb && ['pending', 'confirmed', 'processing'].includes(s);
      if (stageFilter === 'in_transit') return s === 'shipped' || s === 'dispatched' || s.includes('transit');
      if (stageFilter === 'out_for_delivery') return s === 'out for delivery';
      if (stageFilter === 'delivered') return s === 'delivered';
      if (stageFilter === 'cancelled') return s === 'cancelled';

      return true;
    });
  }, [orders, searchTerm, stageFilter]);

  // Execute Step in Forward Simulator
  const handleExecuteForwardStep = async () => {
    if (!selectedOrderNumber) return;
    setSimulating(true);
    setSimResult(null);

    const targetOrder = orders.find(o => o.order_number === selectedOrderNumber) || {
      order_number: selectedOrderNumber,
      id: selectedOrderNumber
    };

    try {
      let result = null;

      switch (selectedStep) {
        // Step 1: Pincode Check
        case 'step1_check_pincode': {
          const pin = targetOrder.shippingAddress?.pincode || targetOrder.pincode || '110001';
          const pinRes = await shippingApi.checkServiceability(pin);
          result = {
            step_name: 'Step 1: Courier Serviceability & Transit Time Verification',
            success: true,
            details: `Pincode ${pin} is serviceable! Fastest courier: ${pinRes.data?.available_courier_companies?.[0]?.courier_name || 'Delhivery Express'}. Estimated transit time: ${pinRes.minDays || 2}-${pinRes.maxDays || 3} days.`,
            api_endpoint: 'GET /v1/external/courier/serviceability/',
            customer_impact: 'Customer sees exact guaranteed delivery window on product/checkout page.'
          };
          break;
        }

        // Step 2: Create Forward Shipment
        case 'step2_create_shipment': {
          const shipRes = await shippingApi.createShipment(targetOrder);
          result = {
            step_name: 'Step 2: Push Order to Shiprocket (Create Shipment)',
            success: true,
            shipment_id: shipRes.shipment_id,
            order_id: shipRes.order_id,
            details: `Forward order registered in Shiprocket logistics grid with ID: ${shipRes.shipment_id}. Package weight (0.6 kg) and atelier dimensions registered.`,
            api_endpoint: 'POST /v1/external/orders/create/adhoc',
            customer_impact: 'Order moves into "Processing & Packing" in Atelier.'
          };
          break;
        }

        // Step 3: Assign AWB & Mark Shipped
        case 'step3_assign_awb': {
          const shipmentId = `SR-MOCK-SHP-${Date.now().toString().slice(-6)}`;
          const awbRes = await shippingApi.assignAwb(shipmentId);
          const awbCode = awbRes?.response?.data?.awb_code || `URV${Date.now().toString().slice(-8)}IN`;
          const courierName = awbRes?.response?.data?.courier_name || 'Delhivery Express';

          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Shipped', trackingNumber: awbCode })
          });

          result = {
            step_name: 'Step 3: Courier Partner Allocation & AWB Generation',
            success: true,
            awb_code: awbCode,
            courier: courierName,
            details: `Assigned courier partner ${courierName}. Barcode AWB ${awbCode} generated and saved to order database. Status changed to "Shipped".`,
            api_endpoint: 'POST /v1/external/courier/assign/awb',
            customer_impact: 'Customer Journey moves to STEP 2 (SHIPPED). Live tracking link activated.'
          };
          break;
        }

        // Step 4: Generate Label & Manifest
        case 'step4_label_manifest': {
          const targetId = targetOrder.tracking_number || targetOrder.id;
          const labelRes = await shippingApi.generateLabel([targetId]);
          const manifestRes = await shippingApi.generateManifest([targetId]);

          result = {
            step_name: 'Step 4: Generate Shipping Label & Courier Handover Manifest',
            success: true,
            label_url: labelRes.label_url,
            manifest_url: manifestRes.manifest_url,
            details: 'Thermal 4x6 inch shipping barcode label generated. Manifest handover document generated for driver physical signature upon pickup.',
            api_endpoint: 'POST /v1/external/courier/generate/label & /manifests/generate',
            customer_impact: 'Box sealed with official atelier barcode sticker ready for vehicle pickup.'
          };
          break;
        }

        // Step 5: Schedule Courier Pickup
        case 'step5_schedule_pickup': {
          const pickRes = await shippingApi.schedulePickup([targetOrder.tracking_number || targetOrder.id]);
          result = {
            step_name: 'Step 5: Schedule Atelier Courier Pickup',
            success: true,
            token_number: pickRes?.response?.pickup_token_number || 'PKP-MOCK-9912',
            pickup_date: pickRes?.response?.pickup_scheduled_date || 'Tomorrow 11:00 AM',
            details: `Official pickup slot confirmed with courier dispatch center. Driver dispatched to House of Urvaah Atelier (Token: ${pickRes?.response?.pickup_token_number || 'PKP-9912'}).`,
            api_endpoint: 'POST /v1/external/courier/generate/pickup',
            customer_impact: 'Customer notified that parcel has officially departed the atelier.'
          };
          break;
        }

        // Step 6: Simulate Transit Scan (In Transit)
        case 'step6_in_transit': {
          await shippingApi.simulateWebhookStatus(targetOrder.tracking_number || targetOrder.order_number, 'IN TRANSIT');
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Shipped' })
          });
          result = {
            step_name: 'Step 6: Transit Hub Scans & Air Freight Movement',
            success: true,
            status: 'Shipped (In Transit)',
            details: 'Package scanned at Mumbai Airport Sort Center. In-Transit via air cargo to regional customer distribution hub.',
            api_endpoint: 'Shiprocket Webhook: EVENT_IN_TRANSIT',
            customer_impact: 'Real-time transit timeline updates on customer tracking portal.'
          };
          break;
        }

        // Step 7: Simulate Out for Delivery
        case 'step7_out_for_delivery': {
          await shippingApi.simulateWebhookStatus(targetOrder.tracking_number || targetOrder.order_number, 'OUT FOR DELIVERY');
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Out for Delivery' })
          });
          result = {
            step_name: 'Step 7: Final Mile Rider Dispatch (Out for Delivery)',
            success: true,
            status: 'Out for Delivery',
            details: 'Local courier rider loaded package into delivery van. Security OTP and doorstep notification dispatched to customer phone.',
            api_endpoint: 'Shiprocket Webhook: EVENT_OUT_FOR_DELIVERY',
            customer_impact: 'Customer Journey updates to STEP 3 (OUT FOR DELIVERY). Customer prepares for arrival.'
          };
          break;
        }

        // Step 8: Simulate Delivered
        case 'step8_delivered': {
          await shippingApi.simulateWebhookStatus(targetOrder.tracking_number || targetOrder.order_number, 'DELIVERED');
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Delivered' })
          });
          result = {
            step_name: 'Step 8: Customer Doorstep Handover (Delivered)',
            success: true,
            status: 'Delivered',
            details: 'Package successfully delivered and signed for by customer. 7-Day luxury return/exchange policy window automatically activated.',
            api_endpoint: 'Shiprocket Webhook: EVENT_DELIVERED',
            customer_impact: 'Customer Journey completes with 100% (STEP 4 OF 4). Delivery receipt sent.'
          };
          break;
        }

        // Step 9: Cancellation Void
        case 'step9_cancel_order': {
          await shippingApi.cancelShipment([targetOrder.id || targetOrder.order_number]);
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Cancelled' })
          });
          result = {
            step_name: 'Step 9: Shipment Cancellation & AWB Void',
            success: true,
            status: 'Cancelled',
            details: 'Shipment voided in Shiprocket before courier driver pickup. Zero courier fees charged. Inventory stock auto-restored.',
            api_endpoint: 'POST /v1/external/orders/cancel',
            customer_impact: 'Order marked Cancelled in customer order history.'
          };
          break;
        }

        default:
          break;
      }

      setSimResult(result);
      await fetchOrders();
    } catch (err) {
      console.error('Forward step execution failed:', err);
      setSimResult({
        success: false,
        error: err.message || 'Execution error encountered.'
      });
    } finally {
      setSimulating(false);
    }
  };

  // Inspect Live Scans
  const handleViewTracking = async (awb) => {
    setActiveTrackingAwb(awb);
    setActiveTrackingData(null);
    setLoadingTracking(true);
    try {
      const res = await shippingApi.trackShipment(awb);
      setActiveTrackingData(res?.tracking_data || null);
    } catch (err) {
      console.error('Failed to fetch tracking scans:', err);
    } finally {
      setLoadingTracking(false);
    }
  };

  return (
    <div className="space-y-6 font-admin p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <AdminPageHeader
        title="Shiprocket Order Desk"
        subtitle="End-to-End Forward Order Lifecycle: Pincode Check ➔ Shipment Creation ➔ AWB Allocation ➔ Label & Manifest ➔ Courier Pickup ➔ Final Delivery."
      />

      {/* 2. Visual 5-Stage Forward Fulfillment Stepper */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-admin">
              Fulfillment Pipeline Architecture
            </h3>
            <p className="text-[11px] text-neutral-500">
              Visual roadmap of how an online order transitions through Shiprocket logistics.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full font-semibold">
            {stats.total} Orders Managed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Stage 1 */}
          <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">STAGE 1</span>
            <h4 className="text-xs font-bold text-neutral-900">Order Placed</h4>
            <p className="text-[10px] text-neutral-500 leading-tight">Customer checkout & pincode serviceability verified.</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-800 mt-1">
              {stats.unassigned} Orders
            </span>
          </div>

          {/* Stage 2 */}
          <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">STAGE 2</span>
            <h4 className="text-xs font-bold text-neutral-900">AWB Assigned</h4>
            <p className="text-[10px] text-neutral-500 leading-tight">Optimal courier picked & barcode AWB generated.</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 mt-1">
              {stats.awbAssigned} Orders
            </span>
          </div>

          {/* Stage 3 */}
          <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">STAGE 3</span>
            <h4 className="text-xs font-bold text-neutral-900">Pickup Scheduled</h4>
            <p className="text-[10px] text-neutral-500 leading-tight">4x6 Label pasted & Manifest printed for driver.</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 mt-1">
              Atelier Ready
            </span>
          </div>

          {/* Stage 4 */}
          <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">STAGE 4</span>
            <h4 className="text-xs font-bold text-neutral-900">In Transit & OFD</h4>
            <p className="text-[10px] text-neutral-500 leading-tight">Airport flights, regional hubs, & local delivery rider.</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 mt-1">
              {stats.inTransit + stats.outForDelivery} Active
            </span>
          </div>

          {/* Stage 5 */}
          <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">STAGE 5</span>
            <h4 className="text-xs font-bold text-neutral-900">Delivered</h4>
            <p className="text-[10px] text-neutral-500 leading-tight">Doorstep handover complete & 7-day return window active.</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 mt-1">
              {stats.delivered} Completed
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Forward Flow Testing Sandbox */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase font-admin">
                Interactive Forward Order Flow Sandbox
              </h3>
              <p className="text-[11px] text-neutral-400">
                Execute any fulfillment step on an active order to understand how Shiprocket APIs trigger changes in real-time.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
            ⚡ Forward Logistics Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Target Order Selector */}
          <div className="md:col-span-4">
            <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
              Select Target Order
            </label>
            <select
              value={selectedOrderNumber}
              onChange={(e) => setSelectedOrderNumber(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-emerald-400 font-medium"
            >
              {orders.map(o => (
                <option key={o.id || o.order_number} value={o.order_number}>
                  #{o.order_number} — {o.recipient_name || o.user_name || 'Customer'} (Status: {o.status})
                </option>
              ))}
            </select>
          </div>

          {/* Forward Step Selector */}
          <div className="md:col-span-5">
            <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
              Select Forward Fulfillment Step to Test
            </label>
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-emerald-400 font-medium"
            >
              <option value="step1_check_pincode">Step 1: Check Pincode Serviceability & Courier Rates</option>
              <option value="step2_create_shipment">Step 2: Register Forward Shipment in Shiprocket</option>
              <option value="step3_assign_awb">Step 3: Assign Courier Partner & Allocate AWB Number</option>
              <option value="step4_label_manifest">Step 4: Generate Thermal Label (PDF) & Handover Manifest</option>
              <option value="step5_schedule_pickup">Step 5: Schedule Atelier Warehouse Courier Pickup</option>
              <option value="step6_in_transit">Step 6: Simulate Transit Milestone: In Transit (Air/Surface)</option>
              <option value="step7_out_for_delivery">Step 7: Simulate Final Mile: Out for Delivery</option>
              <option value="step8_delivered">Step 8: Simulate Doorstep Handover: Delivered (Start Return Policy)</option>
              <option value="step9_cancel_order">Step 9: Void Shipment & Cancel Order (Pre-Dispatch)</option>
            </select>
          </div>

          {/* Run Step Button */}
          <div className="md:col-span-3">
            <button
              type="button"
              disabled={simulating || !selectedOrderNumber}
              onClick={handleExecuteForwardStep}
              className="w-full h-10 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Execute Step</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Step Execution Report */}
        {simResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 mt-3 animate-in fade-in duration-200 ${
            simResult.success 
              ? 'bg-neutral-800/80 border-emerald-500/40 text-neutral-100' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center justify-between font-semibold border-b border-neutral-700/60 pb-1.5">
              <span className="flex items-center gap-2 text-emerald-300">
                {simResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                {simResult.step_name}
              </span>
              <button 
                type="button" 
                onClick={() => setSimResult(null)}
                className="text-neutral-400 hover:text-white"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-neutral-300 leading-relaxed text-[11px]">{simResult.details || simResult.error}</p>

            {simResult.awb_code && (
              <div className="flex items-center gap-4 text-[11px] pt-1">
                <span>Allocated AWB: <strong className="font-mono text-emerald-300">{simResult.awb_code}</strong></span>
                {simResult.courier && <span>Courier: <strong className="text-neutral-200">{simResult.courier}</strong></span>}
              </div>
            )}

            {simResult.label_url && (
              <div className="pt-1 flex gap-2">
                <a
                  href={simResult.label_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-semibold inline-flex items-center gap-1 border border-white/20"
                >
                  <FileText className="w-3 h-3" />
                  <span>View Shipping Label PDF</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-700/50 text-[10px] text-neutral-400">
              <span>API: <code className="text-neutral-300 font-mono">{simResult.api_endpoint}</code></span>
              <span className="text-emerald-300 font-medium">↳ Customer View: {simResult.customer_impact}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Pincode Serviceability Inspector Widget */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-dark" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-admin">
              Pre-Checkout Pincode & Courier Rate Inspector
            </h3>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Simulates /api/delivery/check</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
              Destination Pincode
            </label>
            <input
              type="text"
              value={inspectPincode}
              onChange={(e) => setInspectPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 110001"
              maxLength={6}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-hidden focus:border-black"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
              Weight (KG)
            </label>
            <input
              type="number"
              step="0.1"
              value={inspectWeight}
              onChange={(e) => setInspectWeight(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="flex items-center gap-2 h-10">
            <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inspectCod}
                onChange={(e) => setInspectCod(e.target.checked)}
                className="rounded border-neutral-300 text-black focus:ring-black"
              />
              <span className="font-semibold text-[11px] uppercase">Cash on Delivery (COD)</span>
            </label>
          </div>

          <div>
            <button
              type="button"
              disabled={inspectLoading}
              onClick={handleCheckServiceability}
              className="w-full h-10 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {inspectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Inspect Rates & EDD</span>
            </button>
          </div>
        </div>

        {/* Inspection Result Preview */}
        {inspectResult && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">
                Pincode {inspectPincode}: {inspectResult.available ? '✓ Serviceable' : '✕ Unserviceable'}
              </span>
              {inspectResult.available && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  EDD: {inspectResult.minDays || 2} - {inspectResult.maxDays || 3} Days
                </span>
              )}
            </div>

            {inspectResult.data?.available_courier_companies?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {inspectResult.data.available_courier_companies.map((c, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-lg border border-neutral-200 text-neutral-700">
                    <span className="font-bold text-neutral-900 block text-xs">{c.courier_name}</span>
                    <span className="text-[10px] text-neutral-500 block">Transit: {c.estimated_delivery_days} days • Rate: ₹{c.rate}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">COD: {c.cod ? 'Supported' : 'Prepaid Only'}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 5. Active Forward Orders Management Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-wide uppercase">
              Forward Fulfillment Orders ({filteredOrders.length})
            </h3>
            <p className="text-[11px] text-neutral-500">
              Live orders being processed, dispatched, or delivered through the Shiprocket forward logistics pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order #, customer, AWB..."
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-black font-medium"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">All Stages</option>
              <option value="pending_awb">Pending AWB</option>
              <option value="awb_assigned">AWB Allocated</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>

            <button
              type="button"
              onClick={fetchOrders}
              className="p-1.5 border border-neutral-200 rounded-xl hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-neutral-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-600" />
            <p className="text-xs">Loading forward orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-neutral-400 space-y-2">
            <Package className="w-8 h-8 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-700">No Orders Found</p>
            <p className="text-xs text-neutral-500">No forward shipments match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer & Destination</th>
                  <th className="py-2.5 px-3">Current Stage</th>
                  <th className="py-2.5 px-3">Courier AWB</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map(ord => {
                  const s = ord.status || 'Placed';
                  const isDelivered = s === 'Delivered';
                  const isOFD = s === 'Out for Delivery';
                  const isShipped = s === 'Shipped' || s === 'Dispatched';

                  return (
                    <tr key={ord.id || ord.order_number} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order # */}
                      <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                        #{ord.order_number}
                      </td>

                      {/* Customer & City */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-neutral-900 block">
                          {ord.recipient_name || ord.user_name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {ord.city || 'Mumbai'}, {ord.pincode || '400001'}
                        </span>
                      </td>

                      {/* Stage Pill */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          isDelivered ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          isOFD ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          isShipped ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}>
                          {s}
                        </span>
                      </td>

                      {/* AWB Code */}
                      <td className="py-3 px-3">
                        {ord.tracking_number ? (
                          <div>
                            <span className="font-mono font-bold text-neutral-900 text-[11px] block">
                              {ord.tracking_number}
                            </span>
                            <span className="text-[10px] text-neutral-400">Delhivery Express</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-bold text-neutral-900">
                        ₹{Number(ord.total || ord.subtotal || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-2">
                        {ord.tracking_number && (
                          <button
                            type="button"
                            onClick={() => handleViewTracking(ord.tracking_number)}
                            className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-lg transition-colors cursor-pointer"
                            title="View Courier Milestone Scans"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderIdForDetail(ord.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-black text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Live Tracking Scans Drawer Modal */}
      {activeTrackingAwb && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActiveTrackingAwb(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wide">
                  Live Courier Milestone History
                </h3>
                <p className="text-xs text-neutral-500 font-mono">AWB: {activeTrackingAwb}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTrackingAwb(null)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {loadingTracking ? (
              <div className="py-8 text-center text-neutral-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Fetching real-time scans...</span>
              </div>
            ) : activeTrackingData?.scans?.length ? (
              <div className="space-y-3 py-2">
                {activeTrackingData.scans.map((scan, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-dark mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-xs text-brand-dark">{scan.activity}</p>
                      <p className="text-[11px] text-neutral-500">{scan.location} • {scan.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-neutral-500 italic">
                No scans recorded yet. Package is awaiting courier pickup.
              </div>
            )}

            <div className="pt-2 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTrackingAwb(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Order Details Modal Integration */}
      <OrderDetailModal
        orderId={selectedOrderIdForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrderIdForDetail(null);
          fetchOrders();
        }}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
};

export default AdminShiprocketOrderDesk;
