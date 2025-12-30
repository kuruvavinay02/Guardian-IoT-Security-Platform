from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import asyncio
import json
import random
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

app = FastAPI()
api_router = APIRouter(prefix="/api")

class Device(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    device_type: str
    ip_address: str
    mac_address: str
    manufacturer: str
    model: str
    firmware_version: str
    status: str
    risk_score: int
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    protocols: List[str] = []
    open_ports: List[int] = []
    is_honeypot: bool = False

class Behavior(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    traffic_volume: float
    connection_count: int
    destinations: List[str]
    is_anomaly: bool = False
    anomaly_score: float = 0.0

class Threat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    threat_type: str
    severity: str
    description: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    mitigated: bool = False
    mitigation_action: Optional[str] = None

class Agent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str
    last_action: str
    confidence: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    severity: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class Incident(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    attack_type: str
    source_ip: str
    target_device_id: str
    timeline: List[Dict[str, Any]]
    explanation: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

device_types = [
    {"type": "Smart Camera", "manufacturer": "Wyze", "model": "Cam v3"},
    {"type": "Smart Lock", "manufacturer": "August", "model": "Wi-Fi Smart Lock"},
    {"type": "Smart Hub", "manufacturer": "Samsung", "model": "SmartThings Hub"},
    {"type": "Smart Bulb", "manufacturer": "Philips", "model": "Hue White"},
    {"type": "Smart Thermostat", "manufacturer": "Nest", "model": "Learning Thermostat"},
    {"type": "Smart TV", "manufacturer": "Samsung", "model": "QLED 4K"},
    {"type": "Smart Speaker", "manufacturer": "Amazon", "model": "Echo Dot"},
    {"type": "Smart Doorbell", "manufacturer": "Ring", "model": "Video Doorbell"},
    {"type": "Security Camera", "manufacturer": "Arlo", "model": "Pro 4"},
    {"type": "Smart Plug", "manufacturer": "TP-Link", "model": "Kasa Smart Plug"},
]

async def generate_ai_analysis(prompt: str) -> str:
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert cybersecurity AI specializing in IoT security. Provide concise, actionable insights."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200
        )
        return response.choices[0].message.content
    except Exception as e:
        fallback_responses = {
            "Botnet": "A botnet infection occurs when malware compromises your device and adds it to a network of infected machines controlled by attackers. These devices can be used to launch attacks, send spam, or mine cryptocurrency without your knowledge. Our system detected unusual outbound connections and isolated the device to prevent further damage.",
            "Unauthorized": "An unauthorized access attempt was detected when an unknown party tried to connect to your device without permission. This could be an attacker trying to gain control or steal data. Our honeypot system captured the attempt and blocked the suspicious IP address.",
            "Data Exfiltration": "Data exfiltration means an attacker is trying to steal information from your device. We detected unusual data transfers to external servers. The device has been isolated to prevent data loss, and we've blocked the destination addresses.",
            "Lateral Movement": "Lateral movement is when an attacker who has compromised one device tries to spread to other devices on your network. We detected suspicious connection attempts between devices and have isolated the affected systems to contain the threat."
        }
        
        for key, response in fallback_responses.items():
            if key.lower() in prompt.lower():
                return response
        
        return "Our AI security analyst detected suspicious activity on this device. The system automatically isolated it and is monitoring for further threats. Your network remains secure."

async def simulate_device_discovery():
    devices = []
    for i in range(15):
        device_info = random.choice(device_types)
        risk_score = random.randint(20, 95)
        device = Device(
            name=f"{device_info['type']} {i+1}",
            device_type=device_info['type'],
            ip_address=f"192.168.1.{100+i}",
            mac_address=f"{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}",
            manufacturer=device_info['manufacturer'],
            model=device_info['model'],
            firmware_version=f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 20)}",
            status="online" if random.random() > 0.1 else "offline",
            risk_score=risk_score,
            protocols=["HTTP", "MQTT"] if random.random() > 0.5 else ["HTTP"],
            open_ports=[80, 443] if random.random() > 0.5 else [80, 443, 8080],
            is_honeypot=False
        )
        devices.append(device)
    
    for i in range(3):
        honeypot = Device(
            name=f"Honeypot {i+1}",
            device_type="Decoy Device",
            ip_address=f"192.168.1.{200+i}",
            mac_address=f"{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}:{''.join(random.choices('0123456789ABCDEF', k=2))}",
            manufacturer="Simulated",
            model="Honeypot",
            firmware_version="1.0.0",
            status="online",
            risk_score=10,
            protocols=["HTTP", "MQTT", "RTSP"],
            open_ports=[80, 443, 554, 8080],
            is_honeypot=True
        )
        devices.append(honeypot)
    
    for device in devices:
        doc = device.model_dump()
        doc['last_seen'] = doc['last_seen'].isoformat()
        await db.devices.insert_one(doc)
    
    return devices

async def initialize_agents():
    agents = [
        Agent(name="Discovery Agent", status="active", last_action="Scanned network and found 18 devices", confidence=0.95),
        Agent(name="Behavior Analysis Agent", status="active", last_action="Analyzing traffic patterns for anomalies", confidence=0.88),
        Agent(name="Risk Assessment Agent", status="active", last_action="Identified 3 devices with outdated firmware", confidence=0.92),
        Agent(name="Deception Agent", status="active", last_action="Managing 3 active honeypots", confidence=0.97),
        Agent(name="Response & Mitigation Agent", status="idle", last_action="Awaiting threat detection", confidence=0.90),
    ]
    
    for agent in agents:
        doc = agent.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.agents.insert_one(doc)
    
    return agents

@api_router.get("/")
async def root():
    return {"message": "IoT Security Platform API", "status": "operational"}

@api_router.post("/initialize")
async def initialize_system():
    await db.devices.delete_many({})
    await db.agents.delete_many({})
    await db.threats.delete_many({})
    await db.behaviors.delete_many({})
    await db.alerts.delete_many({})
    await db.incidents.delete_many({})
    
    devices = await simulate_device_discovery()
    agents = await initialize_agents()
    
    threat = Threat(
        device_id=devices[0].id,
        threat_type="Botnet Activity",
        severity="high",
        description="Unusual outbound connections detected",
        mitigated=False
    )
    doc = threat.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.threats.insert_one(doc)
    
    alert = Alert(
        title="High-Risk Device Detected",
        message="Smart Camera 1 has outdated firmware and is vulnerable to CVE-2024-1234",
        severity="high"
    )
    doc = alert.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.alerts.insert_one(doc)
    
    return {"message": "System initialized", "devices": len(devices), "agents": len(agents)}

@api_router.get("/devices", response_model=List[Device])
async def get_devices():
    devices = await db.devices.find({}, {"_id": 0}).to_list(1000)
    for device in devices:
        if isinstance(device.get('last_seen'), str):
            device['last_seen'] = datetime.fromisoformat(device['last_seen'])
    return devices

@api_router.get("/devices/{device_id}", response_model=Device)
async def get_device(device_id: str):
    device = await db.devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if isinstance(device.get('last_seen'), str):
        device['last_seen'] = datetime.fromisoformat(device['last_seen'])
    return device

@api_router.post("/devices/{device_id}/isolate")
async def isolate_device(device_id: str):
    result = await db.devices.update_one(
        {"id": device_id},
        {"$set": {"status": "isolated"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    alert = Alert(
        title="Device Isolated",
        message=f"Device has been isolated from the network",
        severity="warning"
    )
    doc = alert.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.alerts.insert_one(doc)
    
    return {"message": "Device isolated successfully"}

@api_router.get("/agents", response_model=List[Agent])
async def get_agents():
    agents = await db.agents.find({}, {"_id": 0}).to_list(1000)
    for agent in agents:
        if isinstance(agent.get('timestamp'), str):
            agent['timestamp'] = datetime.fromisoformat(agent['timestamp'])
    return agents

@api_router.get("/threats", response_model=List[Threat])
async def get_threats():
    threats = await db.threats.find({}, {"_id": 0}).to_list(1000)
    for threat in threats:
        if isinstance(threat.get('timestamp'), str):
            threat['timestamp'] = datetime.fromisoformat(threat['timestamp'])
    return threats

@api_router.post("/threats/{threat_id}/mitigate")
async def mitigate_threat(threat_id: str, action: str):
    result = await db.threats.update_one(
        {"id": threat_id},
        {"$set": {"mitigated": True, "mitigation_action": action}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Threat not found")
    return {"message": "Threat mitigated"}

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts():
    alerts = await db.alerts.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    for alert in alerts:
        if isinstance(alert.get('timestamp'), str):
            alert['timestamp'] = datetime.fromisoformat(alert['timestamp'])
    return alerts

@api_router.get("/incidents", response_model=List[Incident])
async def get_incidents():
    incidents = await db.incidents.find({}, {"_id": 0}).to_list(1000)
    for incident in incidents:
        if isinstance(incident.get('timestamp'), str):
            incident['timestamp'] = datetime.fromisoformat(incident['timestamp'])
    return incidents

@api_router.post("/incidents/generate")
async def generate_incident():
    devices = await db.devices.find({}, {"_id": 0}).to_list(1000)
    if not devices:
        raise HTTPException(status_code=400, detail="No devices found")
    
    target_device = random.choice(devices)
    attack_types = ["Botnet Infection", "Unauthorized Access", "Data Exfiltration", "Lateral Movement"]
    attack_type = random.choice(attack_types)
    
    timeline = [
        {"time": "00:00:00", "event": "Suspicious connection attempt detected", "severity": "low"},
        {"time": "00:00:15", "event": "Multiple failed authentication attempts", "severity": "medium"},
        {"time": "00:00:45", "event": "Honeypot interaction logged", "severity": "high"},
        {"time": "00:01:00", "event": "Attack signature identified and blocked", "severity": "critical"},
    ]
    
    explanation = await generate_ai_analysis(
        f"Explain a {attack_type} attack on a {target_device['device_type']} device in plain language for non-technical users."
    )
    
    incident = Incident(
        attack_type=attack_type,
        source_ip=f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
        target_device_id=target_device['id'],
        timeline=timeline,
        explanation=explanation
    )
    
    doc = incident.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.incidents.insert_one(doc)
    
    return incident

@api_router.get("/behaviors/{device_id}")
async def get_device_behaviors(device_id: str):
    behaviors = await db.behaviors.find({"device_id": device_id}, {"_id": 0}).to_list(1000)
    for behavior in behaviors:
        if isinstance(behavior.get('timestamp'), str):
            behavior['timestamp'] = datetime.fromisoformat(behavior['timestamp'])
    return behaviors

@api_router.post("/behaviors/simulate")
async def simulate_behaviors():
    devices = await db.devices.find({}, {"_id": 0}).to_list(1000)
    behaviors = []
    
    for device in devices:
        for i in range(10):
            is_anomaly = random.random() > 0.85
            behavior = Behavior(
                device_id=device['id'],
                traffic_volume=random.uniform(10, 1000) * (3 if is_anomaly else 1),
                connection_count=random.randint(5, 50) * (2 if is_anomaly else 1),
                destinations=[f"api.service{j}.com" for j in range(random.randint(1, 5))],
                is_anomaly=is_anomaly,
                anomaly_score=random.uniform(0.7, 0.95) if is_anomaly else random.uniform(0, 0.3)
            )
            doc = behavior.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.behaviors.insert_one(doc)
            behaviors.append(behavior)
    
    return {"message": f"Generated {len(behaviors)} behavior records"}

@api_router.get("/stats")
async def get_stats():
    devices_count = await db.devices.count_documents({})
    threats_count = await db.threats.count_documents({})
    alerts_count = await db.alerts.count_documents({"read": False})
    honeypots_count = await db.devices.count_documents({"is_honeypot": True})
    
    devices = await db.devices.find({}, {"_id": 0}).to_list(1000)
    avg_risk = sum(d.get('risk_score', 0) for d in devices) / len(devices) if devices else 0
    
    return {
        "total_devices": devices_count,
        "active_threats": threats_count,
        "unread_alerts": alerts_count,
        "active_honeypots": honeypots_count,
        "avg_risk_score": round(avg_risk, 1),
        "network_health": "good" if avg_risk < 50 else "warning" if avg_risk < 70 else "critical"
    }

@api_router.get("/network-topology")
async def get_network_topology():
    devices = await db.devices.find({}, {"_id": 0}).to_list(1000)
    
    nodes = [
        {"id": "router", "name": "Network Router", "type": "router", "risk": 0}
    ]
    
    for device in devices:
        nodes.append({
            "id": device['id'],
            "name": device['name'],
            "type": device['device_type'],
            "risk": device['risk_score'],
            "is_honeypot": device.get('is_honeypot', False),
            "status": device.get('status', 'online')
        })
    
    links = []
    for device in devices:
        links.append({
            "source": "router",
            "target": device['id']
        })
    
    return {"nodes": nodes, "links": links}

@api_router.post("/ai/analyze")
async def ai_analyze(query: Dict[str, str]):
    analysis = await generate_ai_analysis(query.get("prompt", ""))
    return {"analysis": analysis}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()