import { useState, useEffect } from 'react';
import { ArrowUpDown, Youtube, Loader2, Music, ThumbsUp, Calendar, Eye } from 'lucide-react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";

function App() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [channelInfo, setChannelInfo] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'views', direction: 'desc' });
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/videos');
        setVideos(response.data.videos);
        setChannelInfo(response.data.channelInfo);
        setTotalViews(response.data.totalViews);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortData = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...videos].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setVideos(sortedData);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-4" />
        <div className="text-lg font-semibold text-gray-700">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{channelInfo?.name}</h1>
          <p className="text-gray-600">Análisis de reproducciones del canal</p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Youtube className="h-8 w-8 text-red-600" />
                <CardTitle className="text-3xl">Estadísticas Generales</CardTitle>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-1">Total de Videos</p>
                  <p className="text-2xl font-bold text-gray-800">{videos.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-1">Total de Reproducciones</p>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(totalViews)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-1">Suscriptores</p>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(channelInfo?.subscriberCount)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-1">Vistas del Canal</p>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(channelInfo?.totalViews)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-4 px-6 text-left">Miniatura</th>
                      <th
                        className="py-4 px-6 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => sortData('title')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Título</span>
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </th>
                      <th
                        className="py-4 px-6 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => sortData('views')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <Eye className="h-4 w-4" />
                          <span className="font-semibold text-gray-700">Reproducciones</span>
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </th>
                      <th className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="font-semibold text-gray-700">Likes</span>
                        </div>
                      </th>
                      <th className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-semibold text-gray-700">Fecha</span>
                        </div>
                      </th>
                      <th className="py-4 px-6 text-center">
                        <span className="font-semibold text-gray-700">Acción</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video, index) => (
                      <tr
                        key={index}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-24 rounded-md shadow-sm"
                          />
                        </td>
                        <td className="py-4 px-6 text-gray-800">{video.title}</td>
                        <td className="py-4 px-6 text-right text-gray-800 font-medium">
                          {formatNumber(video.views)}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-800">
                          {formatNumber(video.likes)}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-800">
                          {formatDate(video.publishedAt)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            <Music className="h-4 w-4" />
                            <span>Reproducir</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
