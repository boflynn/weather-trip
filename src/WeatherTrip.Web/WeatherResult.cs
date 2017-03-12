using System;
using System.Collections.Generic;

namespace WeatherTrip.Web
{
    public class WeatherResult
    {
        public Location Location { get; set; } = new Location();

        public List<Forecast> Forecasts { get; set; } = new List<Forecast>();
    }

    public class Location
    {
        public string Name { get; set; }

        public double Lat { get; set; }

        public double Long { get; set; }
    }

    public class Forecast
    {
        public DateTime Date { get; set; }

        public double MaxTemp { get; set; }

        public double MinTemp { get; set; }

        public string Condition { get; set; }

        public string IconUrl { get; set; }
    }
}