import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Download, Search, Users, Globe2, Database, UploadCloud, BarChart3, ChevronRight, ArrowUpDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar, Legend } from "recharts";
import { motion } from "framer-motion";

// -------------------------------
// Helper: seeded random so demo is stable
// -------------------------------
function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}

const REGIONS = [
  { id: "us-east-005", label: "US-East-005" },
  { id: "us-west-001", label: "US-West-001" },
  { id: "us-west-004", label: "US-West-004" },
  { id: "eu-central-003", label: "EU-Central-003" },
  { id: "ca-east-006", label: "CA-East-006" },
];

const DAYS = 90; // daily CSV horizon

function generateDemoData(seed = 1337){
  const rand = mulberry32(seed);
  const customers = [];
  const start = new Date();
  start.setDate(start.getDate() - (DAYS - 1));

  for(let i=1;i<=100;i++){
    const name = `Customer ${i.toString().padStart(3,"0")}`;
    // each customer in 1-2 regions
    const regionCount = 1 + Math.floor(rand()*2);
    const regions = Array.from({length: regionCount}, (_,k)=> REGIONS[Math.floor(rand()*REGIONS.length)].id);
    const bucketCount = 1 + Math.floor(rand()*5);

    // Create buckets
    const buckets = Array.from({length: bucketCount}, (_,b)=> ({
      name: `${name.toLowerCase().replaceAll(" ", "-")}-bucket-${b+1}`,
      region: regions[Math.floor(rand()*regions.length)],
      storageW: 0,
      egressW: 0,
    }));

    // Randomize per-bucket weights (stable via seeded rand)
    let swSum = 0, ewSum = 0;
    buckets.forEach(b=>{ b.storageW = 0.5 + rand()*1.5; swSum += b.storageW; b.egressW = 0.3 + rand()*2.0; ewSum += b.egressW; });
    buckets.forEach(b=>{ b.storageW = b.storageW / swSum; b.egressW = b.egressW / ewSum; });

    // daily usage time series
    const daily = [];
    let baseStorageTB = 2 + rand()*150; // 2–152 TB starting
    for(let d=0; d<DAYS; d++){
      const date = new Date(start);
      date.setDate(start.getDate()+d);
      // storage drift
      baseStorageTB = Math.max(1, baseStorageTB + (rand()-0.45));
      const egressTB = Math.max(0, (baseStorageTB * (0.02 + rand()*0.06)) * (rand() > 0.15 ? 0.4 : 1)); // bursty
      const requests = Math.floor(500 + rand()*20000);
      daily.push({
        date: date.toISOString().slice(0,10),
        storageTB: +baseStorageTB.toFixed(2),
        egressTB: +egressTB.toFixed(2),
        requests,
      });
    }

    customers.push({ id: `cust-${i}`, name, regions: [...new Set(regions)], buckets, daily });
  }

  return customers;
}

function formatTB(v){
  return `${v.toLocaleString(undefined,{maximumFractionDigits:2})} TB`;
}

function aggregate(customers, regionFilter, daysBack){
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (daysBack-1));

  let totalStorage = 0, totalEgress = 0, totalBuckets = 0, totalReq = 0;
  const perDay: Record<string, { date: string; storageTB: number; egressTB: number; requests: number }> = {};

  customers.forEach(c=>{
    if(regionFilter !== 'all' && !c.regions.includes(regionFilter)) return;
    totalBuckets += c.buckets.length;
    c.daily.forEach(p=>{
      const d = new Date(p.date);
      if(d < start || d > end) return;
      totalStorage += p.storageTB;
      totalEgress += p.egressTB;
      totalReq += p.requests;
      perDay[p.date] = perDay[p.date] || { date: p.date, storageTB:0, egressTB:0, requests:0 };
      perDay[p.date].storageTB += p.storageTB;
      perDay[p.date].egressTB += p.egressTB;
      perDay[p.date].requests += p.requests;
    });
  });

  // average storage across customers per day (not sum), more intuitive for the big number
  const daysCount = Object.keys(perDay).length || 1;
  const avgStoragePerDayTB = totalStorage / daysCount;

  return {
    totals: {
      avgStorageTB: avgStoragePerDayTB,
      egressTB: totalEgress,
      requests: totalReq,
      buckets: totalBuckets,
    },
    series: Object.values(perDay).sort((a,b)=> a.date.localeCompare(b.date))
  }
}

export default function PartnerConsoleDemo(){
  const [customers, setCustomers] = useState([]);
  const [region, setRegion] = useState('all');
  const [daysBack, setDaysBack] = useState(30);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });

  useEffect(()=>{
    setCustomers(generateDemoData());
  },[]);

  const { totals, series } = useMemo(()=> aggregate(customers, region, daysBack), [customers, region, daysBack]);

  const filtered = useMemo(()=>{
    return customers.filter(c=> (region==='all' || c.regions.includes(region)) && (q==='' || c.name.toLowerCase().includes(q.toLowerCase())));
  }, [customers, region, q]);

  const sorted = useMemo(()=>{
    const last30Metrics = (c)=>{
      const last30 = c.daily.slice(-30);
      const avgStorage = last30.reduce((a,b)=>a+b.storageTB,0)/Math.max(1,last30.length);
      const sumEgress = last30.reduce((a,b)=>a+b.egressTB,0);
      return { avgStorage, sumEgress, buckets: c.buckets.length };
    };
    const arr = [...filtered];
    arr.sort((a,b)=>{
      const ma = last30Metrics(a), mb = last30Metrics(b);
      let va, vb;
      if (sortBy.key === 'buckets') { va = ma.buckets; vb = mb.buckets; }
      else if (sortBy.key === 'storage') { va = ma.avgStorage; vb = mb.avgStorage; }
      else if (sortBy.key === 'egress') { va = ma.sumEgress; vb = mb.sumEgress; }
      else { va = a.name; vb = b.name; }
      const cmp = (va>vb) ? 1 : (va<vb ? -1 : 0);
      return sortBy.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy]);

  function toggleSort(key){
    setSortBy((prev)=> prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key==='name' ? 'asc' : 'desc' });
  }

  function downloadCSV(){
    // Daily CSV usage report example (flattened): date,customer,region,bucket,storageTB,egressTB,requests
    const rows = [["date","customer","region","bucket","storageTB","egressTB","requests"]];
    customers.forEach(c=>{
      c.daily.forEach(p=>{
        c.buckets.forEach(b=>{
          const bStorage = +(p.storageTB * b.storageW).toFixed(2);
          const bEgress  = +(p.egressTB  * b.egressW ).toFixed(2);
          const bReq     = Math.round(p.requests * b.egressW);
          rows.push([p.date, c.name, b.region, b.name, bStorage, bEgress, bReq]);
        });
      });
    });
    const csv = rows.map(r=> r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'b2_partner_daily_usage_demo.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="h-10 w-10 rounded-2xl bg-black text-white grid place-items-center font-bold">B2</motion.div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Powered by Backblaze — Partner Console (Demo)</h1>
            <p className="text-sm text-muted-foreground">100 customers • multi‑region • daily usage (storage, egress, requests) • buckets</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadCSV} variant="secondary" className="gap-2"><Download className="h-4 w-4"/>Sample CSV</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4">
        <Card className="xl:col-span-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex gap-2 items-center w-full md:w-auto">
                <div className="flex items-center gap-2 w-full md:w-80">
                  <Search className="h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Search customers…" value={q} onChange={e=>setQ(e.target.value)} />
                </div>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Region"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All regions</SelectItem>
                    {REGIONS.map(r=> <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(daysBack)} onValueChange={v=>setDaysBack(Number(v))}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Date range"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Tabs defaultValue="overview" className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Database className="h-4 w-4"/>Avg Stored</CardTitle>
            <Badge variant="secondary">{daysBack}d</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatTB(totals.avgStorageTB)}</div>
            <p className="text-sm text-muted-foreground">Average TB stored per day (scope)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><UploadCloud className="h-4 w-4"/>Total Egress</CardTitle>
            <Badge variant="secondary">{daysBack}d</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatTB(totals.egressTB)}</div>
            <p className="text-sm text-muted-foreground">Sum TB delivered (scope)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4"/>Customers</CardTitle>
            <Badge variant="secondary">Filtered</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{sorted.length}</div>
            <p className="text-sm text-muted-foreground">of 100 total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Globe2 className="h-4 w-4"/>Buckets</CardTitle>
            <Badge variant="secondary">Across scope</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totals.buckets.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total buckets provisioned</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4"/>Storage vs Egress (Daily)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} hide={false}/>
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']}/>
                  <Tooltip formatter={(value: number, name: string) => `${Number(value).toFixed(2)} TB`} />
                  <Legend />
                  <Area type="monotone" dataKey="storageTB" name="Avg Stored TB" stroke="currentColor" fillOpacity={1} fill="url(#g1)"/>
                  <Area type="monotone" dataKey="egressTB" name="Egress TB" stroke="currentColor" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Requests (Daily)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} hide={false}/>
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']}/>
                  <Tooltip />
                  <Bar dataKey="requests" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4"/>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px] pr-2">
            <div className="grid grid-cols-12 gap-3 text-xs px-2 py-2 font-medium text-muted-foreground border-b">
              <div className="col-span-3">Customer</div>
              <div className="col-span-2">Regions</div>
              <button className="col-span-2 text-left flex items-center gap-1" onClick={()=>toggleSort('buckets')}>Buckets <ArrowUpDown className="h-3 w-3"/></button>
              <button className="col-span-2 text-left flex items-center gap-1" onClick={()=>toggleSort('storage')}>Storage (30d avg) <ArrowUpDown className="h-3 w-3"/></button>
              <button className="col-span-2 text-left flex items-center gap-1" onClick={()=>toggleSort('egress')}>Egress (30d sum) <ArrowUpDown className="h-3 w-3"/></button>
              <div className="col-span-1 text-right">Details</div>
            </div>

            {sorted.map(c=>{
              const last30 = c.daily.slice(-30);
              const avgStorage = last30.reduce((a,b)=>a+b.storageTB,0)/Math.max(1,last30.length);
              const sumEgress = last30.reduce((a,b)=>a+b.egressTB,0);
              return (
                <div key={c.id} className="grid grid-cols-12 gap-3 items-center px-2 py-3 border-b">
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-slate-900 text-white grid place-items-center text-[10px] font-bold">{c.name.split(" ")[1]}</div>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.buckets.length} buckets</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex gap-1 flex-wrap">
                    {c.regions.map(r=> <Badge key={r} variant="outline">{REGIONS.find(x=>x.id===r)?.label || r}</Badge>)}
                  </div>
                  <div className="col-span-2">{c.buckets.length}</div>
                  <div className="col-span-2">{formatTB(avgStorage)}</div>
                  <div className="col-span-2">{formatTB(sumEgress)}</div>
                  <div className="col-span-1 text-right">
                    <Button size="icon" variant="ghost" onClick={()=>setSelected(c)}><ChevronRight className="h-4 w-4"/></Button>
                  </div>
                </div>
              )
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail drawer/dialog */}
      <Dialog open={!!selected} onOpenChange={()=>setSelected(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center text-[10px] font-bold">{selected?.name.split(" ")[1]}</div>
              {selected?.name}
              <Badge variant="secondary" className="ml-2">{selected?.buckets.length} buckets</Badge>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Regions</CardTitle></CardHeader><CardContent className="pt-0 flex gap-2 flex-wrap">{selected.regions.map(r=> <Badge key={r}>{REGIONS.find(x=>x.id===r)?.label||r}</Badge>)}</CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-sm">30d Avg Stored</CardTitle></CardHeader><CardContent className="pt-0 text-2xl font-semibold">{formatTB(selected.daily.slice(-30).reduce((a,b)=>a+b.storageTB,0)/30)}</CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-sm">30d Egress</CardTitle></CardHeader><CardContent className="pt-0 text-2xl font-semibold">{formatTB(selected.daily.slice(-30).reduce((a,b)=>a+b.egressTB,0))}</CardContent></Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Storage Trend (TB)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selected.daily.slice(-60)}>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
                          <YAxis tick={{ fontSize: 12 }}/>
                          <Tooltip />
                          <Line type="monotone" dataKey="storageTB" name="Stored TB" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Egress Trend (TB)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selected.daily.slice(-60)}>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
                          <YAxis tick={{ fontSize: 12 }}/>
                          <Tooltip />
                          <Line type="monotone" dataKey="egressTB" name="Egress TB" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Buckets</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                    <div className="col-span-5">Bucket</div>
                    <div className="col-span-3">Region</div>
                    <div className="col-span-2">30d Avg TB</div>
                    <div className="col-span-2">30d Egress TB</div>
                  </div>
                  {selected.buckets.map(b=>{
                    const totalAvgTB = selected.daily.slice(-30).reduce((a,p)=>a+p.storageTB,0)/30;
                    const totalEgTB  = selected.daily.slice(-30).reduce((a,p)=>a+p.egressTB,0);
                    const avgTB = totalAvgTB * (b.storageW || 1/selected.buckets.length);
                    const sumEg = totalEgTB  * (b.egressW  || 1/selected.buckets.length);
                    return (
                      <div key={b.name} className="grid grid-cols-12 gap-2 py-2 border-b">
                        <div className="col-span-5 font-medium">{b.name}</div>
                        <div className="col-span-3"><Badge variant="outline">{REGIONS.find(x=>x.id===b.region)?.label || b.region}</Badge></div>
                        <div className="col-span-2">{avgTB.toFixed(2)}</div>
                        <div className="col-span-2">{sumEg.toFixed(2)}</div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-xs text-muted-foreground mt-6">
        Demo data is synthetic. Use the “Sample CSV” to see expected schema: <code>date, customer, region, bucket, storageTB, egressTB, requests</code>.
        In production, ingest daily CSV usage reports from Backblaze Partner APIs into this UI.
      </div>
    </div>
  );
}
