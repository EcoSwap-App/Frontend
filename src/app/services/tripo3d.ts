import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TripoTask {
  task_id: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  progress: number;
  model_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Tripo3dService {
  private readonly API_URL = '/tripo-api/v2/openapi';
  private readonly API_KEY = environment.tripoApiKey;

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.API_KEY}`,
    });
  }

  constructor(private http: HttpClient) {}

  /**
   * Genera un modelo 3D a partir de una URL de imagen
   */
  generateFromImageUrl(imageUrl: string): Observable<string> {
    const body = {
      type: 'image_to_model',
      file: {
        type: 'url',
        url: imageUrl,
      },
    };

    return this.http
      .post<any>(`${this.API_URL}/task`, body, {
        headers: this.headers,
      })
      .pipe(map((res) => res.data.task_id));
  }

  /**
   * Genera un modelo 3D a partir de una imagen en Base64
   */
  generateFromBase64(base64Data: string, mimeType: string = 'image/jpeg'): Observable<string> {
    const body = {
      type: 'image_to_model',
      file: {
        type: 'base64',
        data: base64Data,
        mime_type: mimeType,
      },
    };

    return this.http
      .post<any>(`${this.API_URL}/task`, body, {
        headers: this.headers,
      })
      .pipe(map((res) => res.data.task_id));
  }

  saveModelUrl(productId: number, modelUrl: string): Observable<any> {
    return this.http.patch(`${environment.platformProviderApiBaseUrl}/products/${productId}`, {
      model_3d: modelUrl,
    });
  }

  /**
   * Consulta el estado de una tarea
   */
  getTaskStatus(taskId: string): Observable<TripoTask> {
    return this.http
      .get<any>(`${this.API_URL}/task/${taskId}`, {
        headers: this.headers,
      })
      .pipe(
        map((res) => ({
          task_id: taskId,
          status: res.data.status,
          progress: res.data.progress || 0,
          model_url: res.data.output?.model || res.data.output?.model_url,
        })),
      );
  }

  /**
   * Polling automático hasta que la tarea termine
   * Retorna el task con model_url cuando status === 'success'
   */
  pollUntilDone(taskId: string, intervalMs: number = 3000): Observable<TripoTask> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getTaskStatus(taskId)),
      takeWhile((task) => task.status === 'queued' || task.status === 'running', true),
    );
  }
}
