using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Options;

namespace WeatherTrip.Web.Controllers
{
    [Route("api/[controller]")]
    public class WeatherController : Controller
    {
        private string _apiBaseUrl = "http://api.apixu.com";
        private string _apiUrl = "/v1/forecast.json?key={0}&q={1}&days={2}";
        private int _days = 1;
        private HttpClient _client;
        private readonly Options _options;

        public WeatherController(IOptions<Options> options)
        {
            _client = new HttpClient();
            _client.BaseAddress = new Uri(_apiBaseUrl);
            _client.DefaultRequestHeaders.Accept.Clear();
            _client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            _options = options.Value;
        }

        [HttpGet("{id}")]
        public async Task<WeatherResult> Get(string id)
        {
            var result = await GetWeatherByZip(id);
            var weather = new WeatherResult();

            weather.Location.Name = (string)result["location"]["name"];
            weather.Location.Lat = (double)result["location"]["lat"];
            weather.Location.Long = (double)result["location"]["lon"];

            foreach (var forecastday in result["forecast"]["forecastday"])
            {
                var day = forecastday["day"];

                var forecast = new Forecast();

                forecast.Date = (DateTime)forecastday["date"];
                forecast.MaxTemp = (double)day["maxtemp_f"];
                forecast.MinTemp = (double)day["mintemp_f"];
                forecast.Condition = (string)day["condition"]["text"];

                weather.Forecasts.Add(forecast);
            }

            return weather;
        }

        public async Task<JObject> GetWeatherByZip(string zip)
        {
            HttpContent contentPost = new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/json");
            HttpResponseMessage response = _client.PostAsync(string.Format(_apiUrl, _options.ApixuApiKey, zip, _days), contentPost).Result;

            if (response.IsSuccessStatusCode)
            {
                var avail = await response.Content.ReadAsStringAsync()
                    .ContinueWith<JObject>(postTask =>
                    {
                        return JObject.Parse(postTask.Result);
                    });

                return avail;
            }

            return null;
        }
    }
}
