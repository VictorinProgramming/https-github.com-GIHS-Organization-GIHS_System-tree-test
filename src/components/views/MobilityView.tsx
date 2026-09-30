import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Navigation,
  Smartphone,
  Car,
  MapPin,
  Clock,
  Gauge,
  Activity,
  CheckCircle2,
  Plus,
  Play,
  Square,
  Search,
  RefreshCw,
  X,
  Eye,
  Battery,
  Radio,
  FileText,
  Fuel,
  LocateFixed,
  AlertCircle,
  TrendingUp,
  Trash2,
  Compass,
  Crosshair,
  Check,
  Loader2
} from 'lucide-react';
import {
  CorporateDevice,
  DeviceAssignment,
  CorporateVehicle,
  VehicleTrip,
  RoutePoint,
  MobilityMetrics,
  Collaborator,
  SupportTicket
} from '../../types';
import { apiBackendService } from '../../services/apiBackendService';
import { geocodingService, GeocodingResult } from '../../services/geocodingService';
import { MobilityLiveMap } from './MobilityLiveMap';

interface MobilityViewProps {
  currentUser: Collaborator;
}

export const MobilityView: React.FC<MobilityViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ROTAS' | 'VEICULOS' | 'DISPOSITIVOS' | 'CUSTODIA' | 'HISTORICO'>('ROTAS');

  const [metrics, setMetrics] = useState<MobilityMetrics | null>(null);
  const [devices, setDevices] = useState<CorporateDevice[]>([]);
  const [vehicles, setVehicles] = useState<CorporateVehicle[]>([]);
  const [assignments, setAssignments] = useState<DeviceAssignment[]>([]);
  const [trips, setTrips] = useState<VehicleTrip[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [selectedTrip, setSelectedTrip] = useState<VehicleTrip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // LOCALIZAÇÃO REAL DO USUÁRIO / DISPOSITIVO
  const [userRealCoords, setUserRealCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  } | null>(null);
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Rastreamento contínuo em tempo real via sensor GPS
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ latitude: number; longitude: number; speed_kmh?: number; accuracy?: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Modais
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState<boolean>(false);
  const [isNewDeviceModalOpen, setIsNewDeviceModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isStartTripModalOpen, setIsStartTripModalOpen] = useState<boolean>(false);
  const [isFinishTripModalOpen, setIsFinishTripModalOpen] = useState<boolean>(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [tripSummaryModal, setTripSummaryModal] = useState<VehicleTrip | null>(null);
  const [returningAssignmentId, setReturningAssignmentId] = useState<string>('');

  // Formulário Novo Veículo
  const [vehModel, setVehModel] = useState<string>('');
  const [vehPlate, setVehPlate] = useState<string>('');
  const [vehCurrentKm, setVehCurrentKm] = useState<string>('0');
  const [vehLastFuelDate, setVehLastFuelDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehFuelType, setVehFuelType] = useState<string>('Flex (Gasolina/Etanol)');

  // Formulário Novo Celular
  const [devTag, setDevTag] = useState<string>('');
  const [devName, setDevName] = useState<string>('');
  const [devModel, setDevModel] = useState<string>('');
  const [devImei, setDevImei] = useState<string>('');
  const [devPhone, setDevPhone] = useState<string>('');
  const [devTechnicianDay, setDevTechnicianDay] = useState<string>(currentUser.name);
  const [devCarrier, setDevCarrier] = useState<string>('Vivo Empresas');

  // Formulário Nova Custódia
  const [assignDeviceId, setAssignDeviceId] = useState<string>('');
  const [assignUserId, setAssignUserId] = useState<string>('');
  const [assignPurpose, setAssignPurpose] = useState<string>('Plantão e Atendimento de Sobreaviso');
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Formulário Devolução
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Formulário Iniciar Corrida
  const [tripUserId, setTripUserId] = useState<string>(currentUser.id);
  const [tripDeviceId, setTripDeviceId] = useState<string>('');
  const [tripSelectedVehicleId, setTripSelectedVehicleId] = useState<string>('');
  const [tripVehicleModel, setTripVehicleModel] = useState<string>('');
  const [tripVehiclePlate, setTripVehiclePlate] = useState<string>('');
  const [tripStartKm, setTripStartKm] = useState<number>(0);
  const [tripLastFuelDate, setTripLastFuelDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tripOriginAddress, setTripOriginAddress] = useState<string>('Obtendo localização real via GPS...');
  const [tripStartLat, setTripStartLat] = useState<number | null>(null);
  const [tripStartLng, setTripStartLng] = useState<number | null>(null);
  const [tripDestination, setTripDestination] = useState<string>('');
  const [tripDestinationLat, setTripDestinationLat] = useState<number | null>(null);
  const [tripDestinationLng, setTripDestinationLng] = useState<number | null>(null);
  const [destSuggestions, setDestSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState<boolean>(false);
  const [destGeocodedLabel, setDestGeocodedLabel] = useState<string | null>(null);
  const [tripTicketId, setTripTicketId] = useState<string>('');
  const [tripPurpose, setTripPurpose] = useState<string>('Deslocamento corporativo / Entrega');

  // Formulário Encerrar Corrida
  const [finishEndKm, setFinishEndKm] = useState<string>('');
  const [finishNotes, setFinishNotes] = useState<string>('Deslocamento concluído no Ponto B.');

  // Filtros do Histórico
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');

  const isManagerOrAdmin = useMemo(() => {
    return ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'].includes(currentUser.userRole || '');
  }, [currentUser]);

  // Função para capturar a localização física real via GPS do dispositivo
  const requestRealLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocalização não suportada neste navegador.');
      return;
    }

    setIsGpsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
        };

        setUserRealCoords(coords);
        setTripStartLat(latitude);
        setTripStartLng(longitude);
        setTripOriginAddress(`Localização Real (Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)})`);
        setIsGpsLocating(false);

        // Geocodificação reversa real
        try {
          const rev = await geocodingService.reverseGeocode(latitude, longitude);
          if (rev) {
            setUserRealCoords({
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              address: rev.shortName || rev.displayName
            });
            setTripOriginAddress(rev.shortName || rev.displayName);
          }
        } catch {
          // Mantém coordenadas reais
        }
      },
      (error) => {
        setIsGpsLocating(false);
        console.warn('Erro ao obter GPS real:', error.message);
        setGpsError(`Permissão de GPS: ${error.message}. Por favor, permita o acesso à localização real no navegador.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Busca e Autocomplete de Endereço de Destino (Ponto B)
  const handleDestinationChange = async (text: string) => {
    setTripDestination(text);
    setDestGeocodedLabel(null);

    if (text.trim().length >= 3) {
      setIsSearchingDest(true);
      const near = userRealCoords ? { latitude: userRealCoords.latitude, longitude: userRealCoords.longitude } : undefined;
      const results = await geocodingService.searchAddress(text, near);
      setDestSuggestions(results);
      setIsSearchingDest(false);
    } else {
      setDestSuggestions([]);
    }
  };

  const handleSelectDestination = (item: GeocodingResult) => {
    setTripDestination(item.shortName || item.displayName);
    setTripDestinationLat(item.latitude);
    setTripDestinationLng(item.longitude);
    setDestGeocodedLabel(`✓ Ponto B Localizado no Mapa: Lat ${item.latitude.toFixed(5)}, Lng ${item.longitude.toFixed(5)}`);
    setDestSuggestions([]);
  };

  const handleGeocodeDestinationNow = async () => {
    if (!tripDestination.trim()) return;
    setIsSearchingDest(true);
    const near = userRealCoords ? { latitude: userRealCoords.latitude, longitude: userRealCoords.longitude } : undefined;
    const results = await geocodingService.searchAddress(tripDestination, near);
    setIsSearchingDest(false);

    if (results.length > 0) {
      handleSelectDestination(results[0]);
    } else {
      setErrorMsg('Não foi possível encontrar as coordenadas exatas deste endereço. Tente especificar rua, número e cidade.');
    }
  };

  // Carrega dados completos do PostgreSQL
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [metricsRes, devicesRes, vehiclesRes, assignmentsRes, tripsRes, usersRes, ticketsRes] = await Promise.all([
        apiBackendService.getMobilityMetrics().catch(() => ({ success: false, data: null })),
        apiBackendService.getMobilityDevices().catch(() => ({ success: false, data: [] })),
        apiBackendService.getMobilityVehicles().catch(() => ({ success: false, data: [] })),
        apiBackendService.getMobilityAssignments().catch(() => ({ success: false, data: [] })),
        apiBackendService.getMobilityTrips().catch(() => ({ success: false, data: [] })),
        apiBackendService.getUsers().catch(() => ({ data: [] })),
        apiBackendService.getTickets().catch(() => ({ data: [] }))
      ]);

      if (metricsRes.success && metricsRes.data) setMetrics(metricsRes.data);
      if (devicesRes.success) setDevices(devicesRes.data || []);
      if (vehiclesRes.success && vehiclesRes.data) {
        setVehicles(vehiclesRes.data || []);
        if (vehiclesRes.data.length > 0 && !tripSelectedVehicleId) {
          const firstVeh = vehiclesRes.data[0];
          setTripSelectedVehicleId(firstVeh.id);
          setTripVehicleModel(firstVeh.model);
          setTripVehiclePlate(firstVeh.plate);
          setTripStartKm(Number(firstVeh.current_km) || 0);
          setTripLastFuelDate(firstVeh.last_fuel_date || new Date().toISOString().split('T')[0]);
        }
      }
      if (assignmentsRes.success) setAssignments(assignmentsRes.data || []);
      if (tripsRes.success && tripsRes.data) {
        setTrips(tripsRes.data || []);
        if (tripsRes.data.length > 0) {
          const currentId = selectedTrip ? selectedTrip.id : tripsRes.data[0].id;
          const detailed = await apiBackendService.getMobilityTripById(currentId);
          if (detailed.success) setSelectedTrip(detailed.data);
        } else {
          setSelectedTrip(null);
        }
      }
      if (usersRes.data) setCollaborators(usersRes.data);
      if (ticketsRes.data) setTickets(ticketsRes.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar dados de mobilidade do PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    requestRealLocation();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Seleciona e carrega rota da viagem
  const handleSelectTrip = async (tripId: string) => {
    try {
      const res = await apiBackendService.getMobilityTripById(tripId);
      if (res.success) {
        setSelectedTrip(res.data);
        setActiveTab('ROTAS');
      }
    } catch {
      setErrorMsg('Erro ao carregar detalhes da rota.');
    }
  };

  // Seleção de carro no modal de início
  const handleVehicleSelect = (vehId: string) => {
    setTripSelectedVehicleId(vehId);
    const found = vehicles.find(v => v.id === vehId);
    if (found) {
      setTripVehicleModel(found.model);
      setTripVehiclePlate(found.plate);
      setTripStartKm(Number(found.current_km) || 0);
      setTripLastFuelDate(found.last_fuel_date || new Date().toISOString().split('T')[0]);
    }
  };

  // Cadastro de Veículo
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehModel || !vehPlate) {
      setErrorMsg('Informe o modelo e a placa do carro.');
      return;
    }

    try {
      const res = await apiBackendService.createMobilityVehicle({
        model: vehModel,
        plate: vehPlate.toUpperCase().trim(),
        current_km: parseFloat(vehCurrentKm) || 0,
        last_fuel_date: vehLastFuelDate,
        fuel_type: vehFuelType,
        operator_name: currentUser.name,
        operator_id: currentUser.id
      });

      if (res.success) {
        setSuccessMsg(`Carro ${vehModel} (${vehPlate.toUpperCase()}) cadastrado do zero com sucesso!`);
        setIsNewVehicleModalOpen(false);
        setVehModel('');
        setVehPlate('');
        setVehCurrentKm('0');
        await loadData();
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar veículo na frota.');
    }
  };

  // Cadastro de Celular Corporativo
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName || !devModel || !devImei || !devPhone) {
      setErrorMsg('Preencha os campos obrigatórios do aparelho (Nome, Modelo, IMEI e Telefone).');
      return;
    }

    try {
      const res = await apiBackendService.createMobilityDevice({
        patrimony_tag: devTag || `GIHS-CEL-${Math.floor(100 + Math.random() * 900)}`,
        name: devName,
        model: devModel,
        operator_name: currentUser.name,
        operator_id: currentUser.id,
        specifications: {
          type: 'Smartphone Corporativo',
          imei: devImei,
          phone_number: devPhone,
          assigned_technician_day: devTechnicianDay || currentUser.name,
          carrier: devCarrier,
          is_on_call_device: true,
          mobility_status: 'Disponível',
          tracking_status: 'STANDBY',
          last_battery_level: 100
        }
      });

      if (res.success) {
        setSuccessMsg('Celular corporativo cadastrado do zero com sucesso!');
        setIsNewDeviceModalOpen(false);
        setDevTag('');
        setDevName('');
        setDevModel('');
        setDevImei('');
        setDevPhone('');
        await loadData();
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar celular corporativo.');
    }
  };

  // Atribuição de Custódia
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDeviceId || !assignUserId) {
      setErrorMsg('Selecione o aparelho e o colaborador.');
      return;
    }

    const user = collaborators.find(c => c.id === assignUserId);

    try {
      const res = await apiBackendService.createMobilityAssignment({
        equipment_id: assignDeviceId,
        user_id: assignUserId,
        user_name: user?.name || 'Colaborador',
        sector_name: user?.sector || 'TI',
        assigned_by: currentUser.id,
        assigned_by_name: currentUser.name,
        purpose: assignPurpose,
        notes: assignNotes
      });

      if (res.success) {
        setSuccessMsg('Custódia do aparelho atribuída com sucesso!');
        setIsAssignModalOpen(false);
        setAssignNotes('');
        await loadData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar custódia.');
    }
  };

  // Devolução de Aparelho
  const handleReturnAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiBackendService.returnMobilityAssignment(
        returningAssignmentId,
        returnNotes,
        currentUser.name,
        currentUser.id
      );

      if (res.success) {
        setSuccessMsg('Devolução do aparelho registrada com sucesso!');
        setIsReturnModalOpen(false);
        setReturnNotes('');
        await loadData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar devolução.');
    }
  };

  // Iniciar Corrida com Localização Real
  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripVehiclePlate || !tripDestination.trim()) {
      setErrorMsg('Informe o veículo, placa e o endereço de destino (Ponto B).');
      return;
    }

    const user = collaborators.find(c => c.id === tripUserId) || currentUser;
    const dev = devices.find(d => d.id === tripDeviceId);
    const ticket = tickets.find(t => t.id === tripTicketId);

    // Coordenadas reais de Ponto A
    let startLat = tripStartLat ?? userRealCoords?.latitude ?? null;
    let startLng = tripStartLng ?? userRealCoords?.longitude ?? null;

    if (!startLat || !startLng) {
      setErrorMsg('Não foi possível obter a sua localização GPS de partida (Ponto A). Clique em "Capturar GPS Real" antes de iniciar.');
      return;
    }

    // Coordenadas reais de Ponto B (Destino)
    let destLat = tripDestinationLat;
    let destLng = tripDestinationLng;

    // Se o usuário digitou sem clicar na sugestão, geocodifica agora
    if (!destLat || !destLng) {
      setIsSearchingDest(true);
      const near = { latitude: startLat, longitude: startLng };
      const searchRes = await geocodingService.searchAddress(tripDestination, near);
      setIsSearchingDest(false);

      if (searchRes.length > 0) {
        destLat = searchRes[0].latitude;
        destLng = searchRes[0].longitude;
        setTripDestinationLat(destLat);
        setTripDestinationLng(destLng);
        setTripDestination(searchRes[0].shortName || searchRes[0].displayName);
      }
    }

    try {
      const res = await apiBackendService.startMobilityTrip({
        user_id: user.id,
        user_name: user.name,
        device_id: tripDeviceId || undefined,
        device_name: dev ? `${dev.name} (${dev.patrimony_tag})` : undefined,
        vehicle_model: tripVehicleModel || 'Veículo Corporativo',
        vehicle_plate: tripVehiclePlate,
        start_km: tripStartKm,
        last_fuel_date: tripLastFuelDate,
        origin_address: tripOriginAddress,
        ticket_id: tripTicketId || undefined,
        ticket_protocol: ticket?.protocol || ticket?.id || undefined,
        destination: tripDestination,
        purpose: tripPurpose,
        start_latitude: startLat,
        start_longitude: startLng,
        destination_latitude: destLat || undefined,
        destination_longitude: destLng || undefined
      });

      if (res.success) {
        setSuccessMsg('Corrida iniciada! Ponto A e Ponto B geolocalizados com sucesso.');
        setIsStartTripModalOpen(false);
        await loadData();
        await handleSelectTrip(res.data.id);
        setActiveTab('ROTAS');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar corrida.');
    }
  };

  // Rastreamento Contínuo por GPS Real do Dispositivo (watchPosition)
  const toggleLiveGpsTracking = () => {
    if (!selectedTrip || selectedTrip.status !== 'EM_ANDAMENTO') {
      setErrorMsg('Selecione uma corrida em andamento para ativar o rastreamento.');
      return;
    }

    if (isLiveGpsActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveGpsActive(false);
      setSuccessMsg('Rastreamento contínuo por GPS do dispositivo pausado.');
      setTimeout(() => setSuccessMsg(null), 3000);
      return;
    }

    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocalização não é suportada neste navegador.');
      return;
    }

    setSuccessMsg('Sensor GPS Real ativado! Transmitindo coordenadas físicas reais ao PostgreSQL...');
    setIsLiveGpsActive(true);

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, accuracy, heading } = pos.coords;
        const speedKmh = speed ? Math.round(speed * 3.6) : 0;

        setLiveGpsCoords({
          latitude,
          longitude,
          speed_kmh: speedKmh,
          accuracy: Math.round(accuracy)
        });

        setUserRealCoords({
          latitude,
          longitude,
          accuracy: Math.round(accuracy)
        });

        try {
          await apiBackendService.addMobilityRoutePoint(selectedTrip.id, {
            latitude,
            longitude,
            speed_kmh: speedKmh,
            accuracy_meters: accuracy,
            heading: heading || 0,
            label: `GPS Real às ${new Date().toLocaleTimeString('pt-BR')} (±${Math.round(accuracy)}m)`
          });

          const updated = await apiBackendService.getMobilityTripById(selectedTrip.id);
          if (updated.success) setSelectedTrip(updated.data);
        } catch (err) {
          console.error('Falha ao enviar coordenada GPS ao backend:', err);
        }
      },
      (err) => {
        console.warn('Erro de geolocalização:', err.message);
        setErrorMsg(`Aviso do sensor GPS: ${err.message}.`);
        setIsLiveGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    watchIdRef.current = watchId;
  };

  // Abrir Modal de Encerramento com KM Final
  const handleOpenFinishModal = (trip: VehicleTrip) => {
    setSelectedTrip(trip);
    const suggestedKm = (Number(trip.start_km) + Number(trip.total_distance_km)).toFixed(1);
    setFinishEndKm(suggestedKm);
    setIsFinishTripModalOpen(true);
  };

  // Finalizar Corrida com KM Final e Duração Real
  const handleConfirmFinishTrip = async () => {
    if (!selectedTrip) return;

    const parsedEndKm = parseFloat(finishEndKm);
    if (isNaN(parsedEndKm) || parsedEndKm < Number(selectedTrip.start_km)) {
      setErrorMsg(`O KM final deve ser maior ou igual ao KM inicial (${selectedTrip.start_km} km).`);
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLiveGpsActive(false);
    }

    try {
      const res = await apiBackendService.finishMobilityTrip(selectedTrip.id, {
        end_km: parsedEndKm,
        end_latitude: userRealCoords?.latitude,
        end_longitude: userRealCoords?.longitude,
        notes: finishNotes
      });

      if (res.success && res.data) {
        setIsFinishTripModalOpen(false);
        setSuccessMsg('Corrida concluída com sucesso! Odômetro e trajeto final gravados no PostgreSQL.');
        await loadData();
        const updated = await apiBackendService.getMobilityTripById(selectedTrip.id);
        if (updated.success) {
          setSelectedTrip(updated.data);
          setTripSummaryModal(updated.data);
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao finalizar corrida.');
    }
  };

  // Limpeza Completa dos Dados para Adicionar do Zero
  const handleConfirmClearAll = async () => {
    try {
      const res = await apiBackendService.clearAllMobilityData();
      if (res.success) {
        setIsClearAllModalOpen(false);
        setSuccessMsg('Todos os dados foram limpos do banco PostgreSQL! A aplicação está pronta do ZERO.');
        setSelectedTrip(null);
        await loadData();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao limpar dados do banco.');
    }
  };

  // Formatação de duração
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}min ${secs}s`;
    return `${mins}min ${secs}s`;
  };

  // Filtragem do Histórico
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (historyStatusFilter !== 'ALL' && t.status !== historyStatusFilter) return false;
      if (historySearch) {
        const s = historySearch.toLowerCase();
        const matchUser = t.user_name.toLowerCase().includes(s);
        const matchPlate = t.vehicle_plate.toLowerCase().includes(s);
        const matchModel = t.vehicle_model.toLowerCase().includes(s);
        const matchDest = t.destination.toLowerCase().includes(s);
        if (!matchUser && !matchPlate && !matchModel && !matchDest) return false;
      }
      return true;
    });
  }, [trips, historyStatusFilter, historySearch]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#01122D] p-6 rounded-3xl border border-[#0A2854] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0067FC] to-[#041838] flex items-center justify-center text-white border border-[#0067FC]/40 shadow-lg shadow-[#0067FC]/20">
            <Navigation className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0067FC]/10 text-[#0067FC] border border-[#0067FC]/30">
                Governança & Mobilidade Corporativa
              </span>
              <span className="text-xs text-slate-400 font-mono">
                PostgreSQL • Geolocalização Real
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Rastreamento em Tempo Real & Frotas
            </h1>
            <p className="text-sm text-slate-400">
              Utilize o GPS físico do dispositivo para telemetria real, cadastro de carros, controle de odômetro e aparelhos corporativos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão de Localização Real */}
          <button
            onClick={requestRealLocation}
            disabled={isGpsLocating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#041838] hover:bg-[#0067FC]/20 text-slate-200 border border-[#0A2854] text-xs font-medium cursor-pointer transition-all"
            title="Atualizar coordenadas GPS reais do seu dispositivo"
          >
            <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${isGpsLocating ? 'animate-spin' : ''}`} />
            <span>{isGpsLocating ? 'Obtendo GPS Real...' : 'Atualizar GPS Real'}</span>
          </button>

          {/* Botão de Atualizar do Banco */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#041838] hover:bg-[#0067FC]/20 text-slate-300 hover:text-white border border-[#0A2854] transition-all cursor-pointer"
            title="Atualizar dados do PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0067FC]' : ''}`} />
          </button>

          {/* Botão Limpar Tudo (Zero) */}
          {isManagerOrAdmin && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-semibold cursor-pointer transition-all"
              title="Limpar todos os dados e começar do zero"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Dados (Zero)</span>
            </button>
          )}

          {/* Iniciar Corrida */}
          <button
            onClick={() => setIsStartTripModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0067FC] to-[#00A6FC] hover:from-[#0052cc] hover:to-[#008de0] text-white font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-[#0067FC]/30"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Iniciar Nova Corrida</span>
          </button>
        </div>
      </div>

      {/* BARRA DE STATUS DO GPS REAL */}
      <div className="bg-[#000B1D] border border-[#0A2854] rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            userRealCoords ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}>
            <Compass className={`w-4 h-4 ${userRealCoords ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Sensor GPS do Dispositivo:</span>
              {userRealCoords ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  ● Sinal Real Conectado (Precisão ±{userRealCoords.accuracy ?? 5}m)
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">
                  Aguardando sinal GPS real...
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {userRealCoords?.address || 'Clique em "Atualizar GPS Real" ou autorize o navegador para capturar sua localização.'}
            </p>
          </div>
        </div>

        {userRealCoords && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300 bg-[#01122D] px-3 py-1.5 rounded-xl border border-[#0A2854] self-start md:self-auto">
            <span>Lat: <strong className="text-white">{userRealCoords.latitude.toFixed(6)}</strong></span>
            <span>Lng: <strong className="text-white">{userRealCoords.longitude.toFixed(6)}</strong></span>
          </div>
        )}
      </div>

      {/* FEEDBACK DE SUCESSO / ERRO */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {(errorMsg || gpsError) && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-medium">{errorMsg || gpsError}</span>
        </div>
      )}

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#01122D] border border-[#0A2854] rounded-2xl">
        <button
          onClick={() => setActiveTab('ROTAS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'ROTAS'
              ? 'bg-[#0067FC] text-white shadow-lg shadow-[#0067FC]/30'
              : 'text-slate-400 hover:text-white hover:bg-[#041838]'
          }`}
        >
          <LocateFixed className="w-4 h-4" />
          <span>Mapa & Rota em Tempo Real</span>
          {selectedTrip && selectedTrip.status === 'EM_ANDAMENTO' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('VEICULOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'VEICULOS'
              ? 'bg-[#0067FC] text-white shadow-lg shadow-[#0067FC]/30'
              : 'text-slate-400 hover:text-white hover:bg-[#041838]'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Veículos da Frota ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DISPOSITIVOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'DISPOSITIVOS'
              ? 'bg-[#0067FC] text-white shadow-lg shadow-[#0067FC]/30'
              : 'text-slate-400 hover:text-white hover:bg-[#041838]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Celulares Corporativos ({devices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CUSTODIA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'CUSTODIA'
              ? 'bg-[#0067FC] text-white shadow-lg shadow-[#0067FC]/30'
              : 'text-slate-400 hover:text-white hover:bg-[#041838]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Custódia & Responsabilidade ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORICO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'HISTORICO'
              ? 'bg-[#0067FC] text-white shadow-lg shadow-[#0067FC]/30'
              : 'text-slate-400 hover:text-white hover:bg-[#041838]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico de Corridas ({trips.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'DASHBOARD'
              ? 'bg-[#0067FC] text-white shadow-lg shadow-[#0067FC]/30'
              : 'text-slate-400 hover:text-white hover:bg-[#041838]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Painel de Indicadores</span>
        </button>
      </div>

      {/* ABA 1: MAPA & ROTA EM TEMPO REAL COM LOCALIZAÇÃO FÍSICA REAL */}
      {activeTab === 'ROTAS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1 & 2: MAPA INTERATIVO REAL */}
            <div className="lg:col-span-2 bg-[#01122D] border border-[#0A2854] rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        selectedTrip && selectedTrip.status === 'EM_ANDAMENTO'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}>
                        {selectedTrip
                          ? (selectedTrip.status === 'EM_ANDAMENTO' ? '● Em Deslocamento Real' : 'Corrida Concluída')
                          : 'Modo Espera / GPS Real'}
                      </span>
                      <h3 className="text-base font-bold text-white truncate max-w-md">
                        {selectedTrip ? selectedTrip.destination : 'Visualização da Sua Posição Real'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedTrip ? (
                        <>Motorista: <strong className="text-slate-200">{selectedTrip.user_name}</strong> • Veículo: <strong className="text-slate-200">{selectedTrip.vehicle_model} ({selectedTrip.vehicle_plate})</strong></>
                      ) : (
                        'Inicie uma corrida ou selecione um trajeto para acompanhar a trajetória.'
                      )}
                    </p>
                  </div>

                  {/* Ações em tempo real quando viagem ativa */}
                  {selectedTrip && selectedTrip.status === 'EM_ANDAMENTO' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={toggleLiveGpsTracking}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                          isLiveGpsActive
                            ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                            : 'bg-[#041838] hover:bg-[#0067FC]/30 text-white border-[#0A2854]'
                        }`}
                        title="Transmite o GPS do celular continuamente ao PostgreSQL"
                      >
                        <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isLiveGpsActive ? 'Transmitindo GPS Real' : 'Ativar Rastreamento GPS'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenFinishModal(selectedTrip)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/40 transition-all cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Concluir Corrida</span>
                      </button>
                    </div>
                  )}

                  {!selectedTrip && (
                    <button
                      onClick={() => setIsStartTripModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-semibold cursor-pointer shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Iniciar Corrida Desta Posição</span>
                    </button>
                  )}
                </div>

                {/* Mapa Leaflet Real com coordenadas reais */}
                <MobilityLiveMap
                  trip={selectedTrip}
                  routePoints={selectedTrip?.route_points || []}
                  livePoint={liveGpsCoords}
                  userRealCoords={userRealCoords}
                  height="410px"
                />

                {/* Ponto A e Ponto B */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="bg-[#000B1D] border border-[#0A2854] rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0067FC]/10 text-[#0067FC] border border-[#0067FC]/30 flex items-center justify-center shrink-0 font-bold font-mono text-xs">
                      A
                    </div>
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Ponto A (Partida Real)</span>
                      <p className="text-white font-medium mt-0.5">
                        {selectedTrip ? (selectedTrip.origin_address || 'Origem') : (userRealCoords?.address || 'Sua Localização Atual')}
                      </p>
                      {selectedTrip && (
                        <span className="text-slate-400 font-mono text-[11px]">KM Inicial: {selectedTrip.start_km} km</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#000B1D] border border-[#0A2854] rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-bold font-mono text-xs">
                      B
                    </div>
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Ponto B (Destino / Entrega)</span>
                      <p className="text-white font-medium mt-0.5">
                        {selectedTrip ? selectedTrip.destination : 'Aguardando início de deslocamento'}
                      </p>
                      {selectedTrip && (
                        <span className="text-slate-400 font-mono text-[11px]">KM Final: {selectedTrip.end_km} km</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas Inferiores */}
              {selectedTrip && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#0A2854] text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">KM Percorrido Real</span>
                    <strong className="text-base text-[#00A6FC] font-mono mt-0.5 block">
                      {selectedTrip.total_distance_km} km
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Tempo de Locomoção</span>
                    <strong className="text-base text-white font-mono mt-0.5 block">
                      {formatDuration(selectedTrip.duration_seconds)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Velocidade Média</span>
                    <strong className="text-base text-emerald-400 font-mono mt-0.5 block">
                      {selectedTrip.avg_speed_kmh} km/h
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Pontos GPS Auditados</span>
                    <strong className="text-base text-purple-400 font-mono mt-0.5 block">
                      {selectedTrip.points_count}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna 3: LINHA DO TEMPO & TELEMETRIA REAL */}
            <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0067FC]" />
                  Telemetria Real da Corrida
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Registro sequencial de pontos GPS transmitidos pelo celular do técnico.
                </p>

                {selectedTrip && (selectedTrip.route_points || []).length > 0 ? (
                  <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                    {(selectedTrip.route_points || []).map((pt, i) => (
                      <div key={pt.id || i} className="flex items-start gap-3 relative border-l-2 border-[#0A2854] pl-3 ml-2">
                        <div className="w-6 h-6 rounded-full bg-[#041838] border border-[#0067FC] text-[#0067FC] flex items-center justify-center font-bold text-[10px] shrink-0 -ml-[19px] mt-0.5">
                          {i + 1}
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-white">{pt.label || `Ponto GPS #${i + 1}`}</p>
                          <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                            {new Date(pt.recorded_at).toLocaleTimeString('pt-BR')} • <strong className="text-emerald-400">{pt.speed_kmh} km/h</strong>
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Lat: {Number(pt.latitude).toFixed(5)}, Lng: {Number(pt.longitude).toFixed(5)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#000B1D] border border-[#0A2854] rounded-2xl">
                    <Crosshair className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-medium">Nenhum ponto registrado ainda.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Inicie uma corrida ou ative o rastreamento GPS para receber telemetria contínua.
                    </p>
                  </div>
                )}
              </div>

              {selectedTrip && (
                <div className="pt-4 border-t border-[#0A2854] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Veículo:</span>
                    <strong className="text-white">{selectedTrip.vehicle_model}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Placa:</span>
                    <strong className="font-mono text-[#00A6FC]">{selectedTrip.vehicle_plate}</strong>
                  </div>
                  {selectedTrip.last_fuel_date && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Último Abastecimento:</span>
                      <span className="font-mono text-amber-300">{new Date(selectedTrip.last_fuel_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: VEÍCULOS DA FROTA (CARRO, PLACA, KM INICIAL/FINAL, ABASTECIMENTO) */}
      {activeTab === 'VEICULOS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Veículos da Frota Corporativa</h3>
              <p className="text-xs text-slate-400">
                Cadastro de carro, placa, odômetro (KM inicial/atual) e data do último abastecimento.
              </p>
            </div>
            {isManagerOrAdmin && (
              <button
                onClick={() => setIsNewVehicleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-[#0067FC]/30 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Carro</span>
              </button>
            )}
          </div>

          {vehicles.length === 0 ? (
            <div className="p-12 text-center bg-[#01122D] border border-dashed border-[#0A2854] rounded-3xl">
              <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Nenhum veículo cadastrado na frota</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                O banco foi limpo para inclusão do zero. Cadastre os carros corporativos com placa, odômetro e data de abastecimento.
              </p>
              <button
                onClick={() => setIsNewVehicleModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-semibold cursor-pointer"
              >
                + Cadastrar Primeiro Carro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(veh => (
                <div
                  key={veh.id}
                  className="bg-[#01122D] border border-[#0A2854] rounded-3xl p-5 shadow-xl hover:border-[#0067FC]/60 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-white bg-[#041838] px-2.5 py-1 rounded-lg border border-[#0A2854]">
                        {veh.plate}
                      </span>
                      <h4 className="text-base font-bold text-white mt-2">{veh.model}</h4>
                      <p className="text-xs text-slate-400">{veh.fuel_type || 'Flex'}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      veh.status === 'DISPONIVEL'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950/80 text-amber-400 border-amber-800'
                    }`}>
                      {veh.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#0A2854] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-[#0067FC]" />
                        KM Atual / Odômetro:
                      </span>
                      <strong className="font-mono text-white text-sm">{veh.current_km} km</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-amber-400" />
                        Último Abastecimento:
                      </span>
                      <span className="font-mono text-slate-200">
                        {veh.last_fuel_date ? new Date(veh.last_fuel_date).toLocaleDateString('pt-BR') : 'Não registrado'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        handleVehicleSelect(veh.id);
                        setIsStartTripModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-[#041838] hover:bg-[#0067FC] text-slate-200 hover:text-white border border-[#0A2854] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar Corrida com este Carro</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: CELULARES CORPORATIVOS (TÉCNICO DO DIA, IMEI, TELEFONE) */}
      {activeTab === 'DISPOSITIVOS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Inventário de Celulares Corporativos</h3>
              <p className="text-xs text-slate-400">
                Cadastro com Técnico Responsável pelo Dia, IMEI, Número de Telefone e status de rastreamento.
              </p>
            </div>
            {isManagerOrAdmin && (
              <button
                onClick={() => setIsNewDeviceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-[#0067FC]/30 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Celular</span>
              </button>
            )}
          </div>

          {devices.length === 0 ? (
            <div className="p-12 text-center bg-[#01122D] border border-dashed border-[#0A2854] rounded-3xl">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Nenhum celular corporativo cadastrado</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Cadastre os aparelhos corporativos utilizados nos plantões com Técnico do Dia, IMEI e Número de Telefone.
              </p>
              <button
                onClick={() => setIsNewDeviceModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-semibold cursor-pointer"
              >
                + Cadastrar Primeiro Celular
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map(device => (
                <div
                  key={device.id}
                  className="bg-[#01122D] border border-[#0A2854] rounded-3xl p-5 shadow-xl hover:border-[#0067FC]/60 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#0067FC] bg-[#0067FC]/10 px-2 py-0.5 rounded-md border border-[#0067FC]/30">
                        {device.patrimony_tag}
                      </span>
                      <h4 className="text-base font-bold text-white mt-2">{device.name}</h4>
                      <p className="text-xs text-slate-400">{device.model}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      device.specifications?.mobility_status === 'Em plantão'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : device.specifications?.mobility_status === 'Em uso'
                        ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}>
                      {device.specifications?.mobility_status || 'Disponível'}
                    </span>
                  </div>

                  {/* Campos Obrigatórios em Destaque */}
                  <div className="p-3 bg-[#000B1D] border border-[#0A2854] rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 font-medium">Técnico do Dia:</span>
                      <strong className="text-emerald-400">
                        {device.specifications?.assigned_technician_day || device.assigned_user_name || 'A definir'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 font-medium">Número Corporativo:</span>
                      <strong className="font-mono text-white">
                        {device.specifications?.phone_number || 'Sem linha vinculada'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 font-medium">IMEI do Aparelho:</span>
                      <span className="font-mono text-slate-300 text-[11px]">
                        {device.specifications?.imei || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 text-xs px-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{device.specifications?.last_battery_level ?? 100}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Radio className="w-3.5 h-3.5 text-[#0067FC]" />
                      <span>{device.specifications?.tracking_status || 'ONLINE'}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {device.specifications?.carrier || 'Corporativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 4: CUSTÓDIA & HISTÓRICO DE RESPONSABILIDADE */}
      {activeTab === 'CUSTODIA' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Histórico de Custódia e Termos de Responsabilidade</h3>
              <p className="text-xs text-slate-400">Rastreabilidade de entrega e devolução dos celulares corporativos.</p>
            </div>
            {isManagerOrAdmin && devices.length > 0 && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-[#0067FC]/30 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Atribuir Aparelho a Funcionário</span>
              </button>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="p-12 text-center bg-[#01122D] border border-dashed border-[#0A2854] rounded-3xl">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Nenhum termo de custódia registrado</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Quando um celular corporativo for entregue a um plantonista, registre o termo de custódia aqui.
              </p>
              {devices.length > 0 && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0067FC] text-white text-xs font-semibold cursor-pointer"
                >
                  Atribuir Aparelho
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#0A2854] bg-[#000B1D]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Celular</th>
                      <th className="py-3 px-4">Funcionário Responsável</th>
                      <th className="py-3 px-4">Entregue em</th>
                      <th className="py-3 px-4">Devolvido em</th>
                      <th className="py-3 px-4">Entregue por</th>
                      <th className="py-3 px-4">Finalidade</th>
                      <th className="py-3 px-4">Status</th>
                      {isManagerOrAdmin && <th className="py-3 px-4 text-right">Ação</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A2854]/60 text-xs text-slate-200">
                    {assignments.map(assign => (
                      <tr key={assign.id} className="hover:bg-[#0067FC]/5">
                        <td className="py-3 px-4">
                          <strong className="text-white block">{assign.patrimony_tag}</strong>
                          <span className="text-[11px] text-slate-400">{assign.device_name}</span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-white">
                          {assign.user_name}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px]">
                          {new Date(assign.assigned_at).toLocaleString('pt-BR')}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px]">
                          {assign.returned_at ? new Date(assign.returned_at).toLocaleString('pt-BR') : '—'}
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          {assign.assigned_by_name || 'Gestor'}
                        </td>

                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {assign.purpose}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            assign.status === 'ATIVO'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}>
                            {assign.status}
                          </span>
                        </td>

                        {isManagerOrAdmin && (
                          <td className="py-3 px-4 text-right">
                            {assign.status === 'ATIVO' && (
                              <button
                                onClick={() => {
                                  setReturningAssignmentId(assign.id);
                                  setIsReturnModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#041838] hover:bg-emerald-500/20 text-emerald-400 border border-[#0A2854] text-[11px] font-semibold cursor-pointer transition-all"
                              >
                                Registrar Devolução
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 5: HISTÓRICO DE CORRIDAS (PESQUISÁVEL) */}
      {activeTab === 'HISTORICO' && (
        <div className="space-y-4">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por colaborador, placa, modelo ou destino..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC] w-80"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-slate-200 focus:outline-none focus:border-[#0067FC] cursor-pointer"
              >
                <option value="ALL">Todos os Status</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="p-12 text-center bg-[#01122D] border border-dashed border-[#0A2854] rounded-3xl">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Nenhuma corrida registrada</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Inicie um deslocamento corporativo para registrar o trajeto, KM percorrido e tempo de locomoção.
              </p>
              <button
                onClick={() => setIsStartTripModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0067FC] text-white text-xs font-semibold cursor-pointer"
              >
                Iniciar Corrida
              </button>
            </div>
          ) : (
            <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#0A2854] bg-[#000B1D]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Funcionário</th>
                      <th className="py-3 px-4">Veículo & Placa</th>
                      <th className="py-3 px-4">Ponto A ➔ Ponto B</th>
                      <th className="py-3 px-4">KM Inicial / Final</th>
                      <th className="py-3 px-4">KM Percorrido</th>
                      <th className="py-3 px-4">Duração</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A2854]/60 text-xs text-slate-200">
                    {filteredTrips.map(trip => (
                      <tr key={trip.id} className="hover:bg-[#0067FC]/5">
                        <td className="py-3.5 px-4 font-mono">
                          {new Date(trip.start_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {trip.user_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-white block">{trip.vehicle_model}</span>
                          <span className="font-mono text-slate-400 text-[11px]">{trip.vehicle_plate}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-slate-300">
                          <span className="text-slate-400 block text-[10px]">Origem: {trip.origin_address || 'Partida'}</span>
                          <span className="text-white font-medium block truncate">Destino: {trip.destination}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span>{trip.start_km} ➔ {trip.end_km} km</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#00A6FC]">
                          {trip.total_distance_km} km
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                          {formatDuration(trip.duration_seconds)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            trip.status === 'EM_ANDAMENTO'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}>
                            {trip.status === 'EM_ANDAMENTO' ? 'Em Deslocamento' : 'Finalizado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSelectTrip(trip.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#041838] hover:bg-[#0067FC] text-slate-300 hover:text-white border border-[#0A2854] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Rota</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 6: DASHBOARD DE INDICADORES (POSTGRESQL PURO) */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-[#01122D] border border-[#0A2854] rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">Em deslocamento agora</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {metrics?.activeTripsCount ?? 0}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Corridas ativas</span>
            </div>

            <div className="bg-[#01122D] border border-[#0A2854] rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">Celulares em plantão</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-[#0067FC] font-mono">
                  {metrics?.onCallDevicesCount ?? 0}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#0067FC]/10 text-[#0067FC] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Aparelhos ativos</span>
            </div>

            <div className="bg-[#01122D] border border-[#0A2854] rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">Veículos em uso</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {metrics?.activeVehiclesCount ?? 0}
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Placas em rota</span>
            </div>

            <div className="bg-[#01122D] border border-[#0A2854] rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">KM percorridos hoje</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {metrics?.kmToday ?? 0} km
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Hoje</span>
            </div>

            <div className="bg-[#01122D] border border-[#0A2854] rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">KM no mês</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-purple-400 font-mono">
                  {metrics?.kmThisMonth ?? 0} km
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Total mês</span>
            </div>

            <div className="bg-[#01122D] border border-[#0A2854] rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">Deslocamentos feitos</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  {metrics?.totalTripsCompleted ?? 0}
                </span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Concluídos</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRAR NOVO CARRO NA FROTA */}
      {isNewVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0067FC]/10 text-[#0067FC] flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cadastrar Veículo na Frota</h3>
                  <p className="text-xs text-slate-400">Adicionar carro do zero no PostgreSQL</p>
                </div>
              </div>
              <button onClick={() => setIsNewVehicleModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Carro / Modelo *</label>
                <input
                  type="text"
                  placeholder="Ex: Fiat Strada Freedom 1.3 CS (Frota 01)"
                  value={vehModel}
                  onChange={e => setVehModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Placa do Carro *</label>
                <input
                  type="text"
                  placeholder="Ex: BRA2E19"
                  value={vehPlate}
                  onChange={e => setVehPlate(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC] font-mono uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">KM Inicial / Odômetro *</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 0 ou 45200"
                    value={vehCurrentKm}
                    onChange={e => setVehCurrentKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white font-mono focus:outline-none focus:border-[#0067FC]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Última Data de Abastecimento</label>
                  <input
                    type="date"
                    value={vehLastFuelDate}
                    onChange={e => setVehLastFuelDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white font-mono focus:outline-none focus:border-[#0067FC]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Tipo de Combustível</label>
                <select
                  value={vehFuelType}
                  onChange={e => setVehFuelType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                >
                  <option value="Flex (Gasolina/Etanol)">Flex (Gasolina / Etanol)</option>
                  <option value="Diesel S10">Diesel S10</option>
                  <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                  <option value="Elétrico / Híbrido">Elétrico / Híbrido</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A2854]">
                <button
                  type="button"
                  onClick={() => setIsNewVehicleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#041838] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-semibold cursor-pointer"
                >
                  Salvar Carro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CADASTRAR CELULAR CORPORATIVO */}
      {isNewDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0067FC]/10 text-[#0067FC] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cadastrar Celular Corporativo</h3>
                  <p className="text-xs text-slate-400">Técnico do dia, IMEI e telefone</p>
                </div>
              </div>
              <button onClick={() => setIsNewDeviceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Identificação / Nome do Celular *</label>
                <input
                  type="text"
                  placeholder="Ex: Celular Corporativo Plantão N1"
                  value={devName}
                  onChange={e => setDevName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Técnico Responsável pelo Dia *</label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva (Técnico de Plantão)"
                  value={devTechnicianDay}
                  onChange={e => setDevTechnicianDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Modelo do Celular *</label>
                  <input
                    type="text"
                    placeholder="Ex: Samsung Galaxy Rugged"
                    value={devModel}
                    onChange={e => setDevModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Tag de Patrimônio</label>
                  <input
                    type="text"
                    placeholder="Ex: GIHS-CEL-001"
                    value={devTag}
                    onChange={e => setDevTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">IMEI *</label>
                  <input
                    type="text"
                    placeholder="Ex: 864521049182741"
                    value={devImei}
                    onChange={e => setDevImei(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC] font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Número de Telefone *</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={devPhone}
                    onChange={e => setDevPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC] font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Operadora</label>
                <input
                  type="text"
                  placeholder="Ex: Vivo Empresas"
                  value={devCarrier}
                  onChange={e => setDevCarrier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A2854]">
                <button
                  type="button"
                  onClick={() => setIsNewDeviceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#041838] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-semibold cursor-pointer"
                >
                  Salvar Celular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INICIAR CORRIDA COM LOCALIZAÇÃO FÍSICA REAL */}
      {isStartTripModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0067FC] to-[#00A6FC] text-white flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Iniciar Corrida / Deslocamento</h3>
                  <p className="text-xs text-slate-400">Ponto A capturado com sua geolocalização física real</p>
                </div>
              </div>
              <button onClick={() => setIsStartTripModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Motorista / Técnico *</label>
                  <select
                    value={tripUserId}
                    onChange={e => setTripUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                  >
                    {collaborators.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.sector || 'Geral'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Celular Corporativo Utilizado</label>
                  <select
                    value={tripDeviceId}
                    onChange={e => setTripDeviceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                  >
                    <option value="">Selecione o celular...</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.patrimony_tag}) • Tel: {d.specifications?.phone_number || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SELEÇÃO DO CARRO DA FROTA */}
              <div className="p-4 bg-[#000B1D] border border-[#0A2854] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-[#0067FC]" />
                    Selecionar Carro da Frota *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewVehicleModalOpen(true)}
                    className="text-[11px] text-[#0067FC] hover:underline cursor-pointer"
                  >
                    + Novo Carro
                  </button>
                </div>

                {vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Carro</span>
                      <select
                        value={tripSelectedVehicleId}
                        onChange={e => handleVehicleSelect(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#01122D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                      >
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.model} ({v.plate})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Placa</span>
                      <input
                        type="text"
                        value={tripVehiclePlate}
                        onChange={e => setTripVehiclePlate(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl bg-[#01122D] border border-[#0A2854] text-xs text-white font-mono uppercase focus:outline-none focus:border-[#0067FC]"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-xl border border-amber-800">
                    Nenhum veículo cadastrado na frota. Preencha os campos abaixo para cadastrar na corrida:
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Modelo do Carro"
                        value={tripVehicleModel}
                        onChange={e => setTripVehicleModel(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#01122D] border border-[#0A2854] text-xs text-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Placa"
                        value={tripVehiclePlate}
                        onChange={e => setTripVehiclePlate(e.target.value.toUpperCase())}
                        className="px-2.5 py-1.5 rounded-lg bg-[#01122D] border border-[#0A2854] text-xs text-white font-mono uppercase"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">KM Inicial (Odômetro) *</span>
                    <input
                      type="number"
                      step="0.1"
                      value={tripStartKm}
                      onChange={e => setTripStartKm(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#01122D] border border-[#0A2854] text-xs text-white font-mono focus:outline-none focus:border-[#0067FC]"
                      required
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Última Data de Abastecimento</span>
                    <input
                      type="date"
                      value={tripLastFuelDate}
                      onChange={e => setTripLastFuelDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#01122D] border border-[#0A2854] text-xs text-white font-mono focus:outline-none focus:border-[#0067FC]"
                    />
                  </div>
                </div>
              </div>

              {/* PONTO A (ORIGEM REAL) & PONTO B (DESTINO) */}
              <div className="space-y-3">
                {/* PONTO A: ORIGEM REAL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0067FC]" />
                      Ponto A (Sua Localização de Partida Real) *
                    </label>
                    <button
                      type="button"
                      onClick={requestRealLocation}
                      disabled={isGpsLocating}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Crosshair className={`w-3 h-3 ${isGpsLocating ? 'animate-spin' : ''}`} />
                      <span>{isGpsLocating ? 'Capturando GPS...' : 'Capturar GPS Agora'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tripOriginAddress}
                    onChange={e => setTripOriginAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC]"
                    placeholder="Sua localização atual detectada via sensor GPS"
                    required
                  />
                  {userRealCoords ? (
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono mt-1 px-1">
                      <span>✓ GPS Real: Lat {userRealCoords.latitude.toFixed(6)}, Lng {userRealCoords.longitude.toFixed(6)}</span>
                      <span>Precisão: ±{userRealCoords.accuracy ?? 5}m</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 mt-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Aguardando sinal do sensor GPS físico. Clique em &quot;Capturar GPS Agora&quot;.</span>
                    </div>
                  )}
                </div>

                {/* PONTO B: DESTINO COM GEOCODIFICAÇÃO EM TEMPO REAL */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Ponto B (Destino / Local de Entrega) *
                    </label>
                    {tripDestinationLat && tripDestinationLng && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Coordenadas Confirmadas
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Rua Guilherme, 490 - Costa e Silva, Joinville"
                      value={tripDestination}
                      onChange={e => handleDestinationChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGeocodeDestinationNow();
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC]"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGeocodeDestinationNow}
                      disabled={isSearchingDest || !tripDestination.trim()}
                      className="px-3 py-2 rounded-xl bg-[#041838] hover:bg-[#0067FC] text-slate-200 hover:text-white border border-[#0A2854] text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1"
                      title="Geocodificar este endereço no mapa"
                    >
                      {isSearchingDest ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Buscar no Mapa</span>
                    </button>
                  </div>

                  {/* Sugestões do Nominatim ao digitar */}
                  {destSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#01122D] border border-[#0067FC] rounded-2xl shadow-2xl p-2 space-y-1 max-h-48 overflow-y-auto">
                      <span className="text-[10px] text-slate-400 uppercase font-mono px-2 block font-bold">
                        Locais encontrados (Selecione o endereço exato):
                      </span>
                      {destSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDestination(sug)}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#0067FC]/20 text-xs text-slate-200 hover:text-white transition-all cursor-pointer flex items-start gap-2"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-white text-[11px]">{sug.shortName}</strong>
                            <span className="text-[10px] text-slate-400 block truncate">{sug.displayName}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {destGeocodedLabel && (
                    <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300 font-mono mt-1.5 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{destGeocodedLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Motivo / Finalidade da Corrida</label>
                <input
                  type="text"
                  placeholder="Ex: Entrega de equipamento urgente ou atendimento externo"
                  value={tripPurpose}
                  onChange={e => setTripPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A2854]">
                <button
                  type="button"
                  onClick={() => setIsStartTripModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#041838] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#0067FC]/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Corrida com GPS Real</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONCLUIR / FINALIZAR CORRIDA */}
      {isFinishTripModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Square className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Concluir Corrida</h3>
                  <p className="text-xs text-slate-400">Confirmar odômetro final ao chegar no Ponto B</p>
                </div>
              </div>
              <button onClick={() => setIsFinishTripModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-[#000B1D] border border-[#0A2854] rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Veículo & Placa:</span>
                  <strong className="text-white">{selectedTrip.vehicle_model} ({selectedTrip.vehicle_plate})</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">KM Inicial Registrado:</span>
                  <strong className="font-mono text-[#0067FC]">{selectedTrip.start_km} km</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Distância Calculada GPS:</span>
                  <strong className="font-mono text-emerald-400">{selectedTrip.total_distance_km} km</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  KM Final do Odômetro * (Obrigatório)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={finishEndKm}
                  onChange={e => setFinishEndKm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white font-mono focus:outline-none focus:border-[#0067FC]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Observações de Chegada</label>
                <textarea
                  rows={2}
                  value={finishNotes}
                  onChange={e => setFinishNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A2854]">
                <button
                  type="button"
                  onClick={() => setIsFinishTripModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#041838] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinishTrip}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  Confirmar e Registrar Corrida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: COMPROVANTE OFICIAL DA CORRIDA REALIZADA */}
      {tripSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#01122D] border-2 border-[#0067FC]/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#0A2854]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    Corrida Gravada no PostgreSQL
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">Resumo da Corrida (Ponto A ➔ B)</h3>
                </div>
              </div>
              <button onClick={() => setTripSummaryModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#000B1D] border border-[#0A2854] rounded-2xl p-4 text-center">
                  <span className="text-xs text-slate-400 font-medium block">KM Percorrido Real</span>
                  <strong className="text-2xl font-black text-[#00A6FC] font-mono mt-1 block">
                    {tripSummaryModal.total_distance_km} km
                  </strong>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Pontos GPS Sequenciais</span>
                </div>

                <div className="bg-[#000B1D] border border-[#0A2854] rounded-2xl p-4 text-center">
                  <span className="text-xs text-slate-400 font-medium block">Tempo de Locomoção</span>
                  <strong className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                    {formatDuration(tripSummaryModal.duration_seconds)}
                  </strong>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {new Date(tripSummaryModal.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ➔ {tripSummaryModal.end_at ? new Date(tripSummaryModal.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Fim'}
                  </span>
                </div>
              </div>

              <div className="bg-[#000B1D] border border-[#0A2854] rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5 mb-2">
                  <Car className="w-4 h-4 text-[#0067FC]" />
                  Dados do Veículo e Combustível
                </h4>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Carro:</span>
                  <span className="font-semibold text-white">{tripSummaryModal.vehicle_model}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Placa:</span>
                  <strong className="font-mono text-[#00A6FC]">{tripSummaryModal.vehicle_plate}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">KM Inicial e Final:</span>
                  <span className="font-mono text-white">{tripSummaryModal.start_km} km ➔ {tripSummaryModal.end_km} km</span>
                </div>
                {tripSummaryModal.last_fuel_date && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Última Data de Abastecimento:</span>
                    <span className="font-mono text-amber-400">{new Date(tripSummaryModal.last_fuel_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="bg-[#000B1D] border border-[#0A2854] rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Trajetória
                </h4>

                <div className="space-y-1.5">
                  <p className="text-slate-300 flex items-start gap-2">
                    <span className="text-xs font-bold text-[#0067FC] shrink-0">Ponto A:</span>
                    <span className="text-white">{tripSummaryModal.origin_address || 'Partida'}</span>
                  </p>
                  <p className="text-slate-300 flex items-start gap-2">
                    <span className="text-xs font-bold text-emerald-400 shrink-0">Ponto B:</span>
                    <span className="text-white">{tripSummaryModal.destination}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#0A2854] flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Gravado no PostgreSQL • {tripSummaryModal.id}
              </span>
              <button
                onClick={() => setTripSummaryModal(null)}
                className="px-5 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-bold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: LIMPAR TODOS OS DADOS (CONFIRMAÇÃO ZERO) */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01122D] border border-rose-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Limpar Dados do Módulo (Zero)</h3>
                <p className="text-xs text-rose-300">Ação irreversível no PostgreSQL</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Esta ação removerá todos os registros de <strong>corridas</strong>, <strong>pontos de rota</strong>, <strong>veículos da frota</strong>, <strong>celulares corporativos</strong> e <strong>custódias</strong>, deixando o módulo 100% limpo para ser preenchido do ZERO.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0A2854]">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#041838] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar Limpeza Total
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ATRIBUIR CUSTÓDIA */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Atribuir Celular a Funcionário</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Celular Disponível *</label>
                <select
                  value={assignDeviceId}
                  onChange={e => setAssignDeviceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                  required
                >
                  <option value="">Selecione o aparelho...</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.patrimony_tag} — {d.name} ({d.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Funcionário Receptor *</label>
                <select
                  value={assignUserId}
                  onChange={e => setAssignUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                  required
                >
                  <option value="">Selecione o funcionário...</option>
                  {collaborators.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.sector || 'TI'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Finalidade da Atribuição</label>
                <input
                  type="text"
                  value={assignPurpose}
                  onChange={e => setAssignPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Observações do Termo</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A2854]">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#041838] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-semibold cursor-pointer"
                >
                  Confirmar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: DEVOLUÇÃO */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Registrar Devolução de Aparelho</h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Observações da Devolução</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white focus:outline-none focus:border-[#0067FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A2854]">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#041838] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirmar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
